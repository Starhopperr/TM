import type {
  TMSpecification,
  ValidationResult,
  ConfigurationView,
  TraceEntryView,
  SimulationStatus,
  CompilerResponse,
  ProjectRecord,
  Transition,
} from "../types/tm";

const BACKEND_URL = "http://127.0.0.1:8000";

// In-browser fallback engine for local-first zero-latency simulation
class LocalSimulator {
  spec: TMSpecification;
  tape: Map<number, string> = new Map();
  headPosition: number = 0;
  currentState: string = "";
  stepNumber: number = 0;
  status: SimulationStatus = "RUNNING";
  trace: TraceEntryView[] = [];
  transitionMap: Map<string, Transition> = new Map();
  inputString: string = "";

  constructor(spec: TMSpecification) {
    this.spec = spec;
    for (const t of spec.transitions) {
      this.transitionMap.set(`${t.state}:::${t.read}`, t);
    }
  }

  initialize(inputString: string): ConfigurationView {
    this.inputString = inputString;
    this.tape.clear();
    this.headPosition = 0;
    this.stepNumber = 0;
    this.currentState = this.spec.start_state;
    this.trace = [];

    for (let i = 0; i < inputString.length; i++) {
      const char = inputString[i];
      if (char !== this.spec.blank_symbol) {
        this.tape.set(i, char);
      }
    }

    if (this.spec.accept_states.includes(this.currentState)) {
      this.status = "ACCEPT";
    } else if (this.spec.reject_states.includes(this.currentState)) {
      this.status = "REJECT";
    } else {
      this.status = "RUNNING";
    }

    return this.getConfigView();
  }

  readCell(idx: number): string {
    return this.tape.get(idx) ?? this.spec.blank_symbol;
  }

  writeCell(idx: number, sym: string): void {
    if (sym === this.spec.blank_symbol) {
      this.tape.delete(idx);
    } else {
      this.tape.set(idx, sym);
    }
  }

  getConfigView(radius = 12): ConfigurationView {
    const visible: { index: number; symbol: string; is_blank: boolean }[] = [];
    for (let idx = this.headPosition - radius; idx <= this.headPosition + radius; idx++) {
      const sym = this.readCell(idx);
      visible.push({
        index: idx,
        symbol: sym,
        is_blank: sym === this.spec.blank_symbol,
      });
    }

    const nonBlankObj: Record<number, string> = {};
    let minIdx: number | null = null;
    let maxIdx: number | null = null;
    for (const [k, v] of this.tape.entries()) {
      nonBlankObj[k] = v;
      if (minIdx === null || k < minIdx) minIdx = k;
      if (maxIdx === null || k > maxIdx) maxIdx = k;
    }

    return {
      step_number: this.stepNumber,
      current_state: this.currentState,
      head_position: this.headPosition,
      status: this.status,
      visible_tape: visible,
      non_blank_cells: nonBlankObj,
      min_index: minIdx,
      max_index: maxIdx,
    };
  }

  step(): {
    step_number: number;
    configuration: ConfigurationView;
    transition_applied: Transition | null;
    status: SimulationStatus;
  } {
    if (this.status !== "RUNNING") {
      return {
        step_number: this.stepNumber,
        configuration: this.getConfigView(),
        transition_applied: null,
        status: this.status,
      };
    }

    const readSym = this.readCell(this.headPosition);
    const key = `${this.currentState}:::${readSym}`;
    const transition = this.transitionMap.get(key);

    const prevHead = this.headPosition;
    const prevState = this.currentState;

    if (!transition) {
      this.status = "HALTED_UNDEFINED_TRANSITION";
      const traceEntry: TraceEntryView = {
        step_number: this.stepNumber + 1,
        state_before: prevState,
        state_after: prevState,
        head_position_before: prevHead,
        head_position_after: prevHead,
        read_symbol: readSym,
        write_symbol: readSym,
        move: "S",
        transition_str: `δ(${prevState}, '${readSym}') = UNDEFINED`,
        outcome: "HALTED_UNDEFINED_TRANSITION",
      };
      this.trace.push(traceEntry);
      return {
        step_number: this.stepNumber,
        configuration: this.getConfigView(),
        transition_applied: null,
        status: this.status,
      };
    }

    // Apply
    this.writeCell(prevHead, transition.write);
    if (transition.move === "L") {
      this.headPosition -= 1;
    } else if (transition.move === "R") {
      this.headPosition += 1;
    }

    this.currentState = transition.next_state;
    this.stepNumber += 1;

    let outcome: SimulationStatus | undefined = undefined;
    if (this.spec.accept_states.includes(this.currentState)) {
      this.status = "ACCEPT";
      outcome = "ACCEPT";
    } else if (this.spec.reject_states.includes(this.currentState)) {
      this.status = "REJECT";
      outcome = "REJECT";
    }

    const traceEntry: TraceEntryView = {
      step_number: this.stepNumber,
      state_before: prevState,
      state_after: this.currentState,
      head_position_before: prevHead,
      head_position_after: this.headPosition,
      read_symbol: readSym,
      write_symbol: transition.write,
      move: transition.move,
      transition_str: `δ(${prevState}, '${readSym}') = (${this.currentState}, '${transition.write}', ${transition.move})`,
      outcome,
    };
    this.trace.push(traceEntry);

    return {
      step_number: this.stepNumber,
      configuration: this.getConfigView(),
      transition_applied: transition,
      status: this.status,
    };
  }

  stepBack(): {
    step_number: number;
    configuration: ConfigurationView;
    status: SimulationStatus;
  } {
    if (this.trace.length === 0) {
      return {
        step_number: this.stepNumber,
        configuration: this.getConfigView(),
        status: this.status,
      };
    }

    // Pop and replay from initial to length-1 for clean state restoration
    this.trace.pop();
    const remainingSteps = [...this.trace];
    this.initialize(this.inputString);
    for (const _ of remainingSteps) {
      this.step();
    }

    return {
      step_number: this.stepNumber,
      configuration: this.getConfigView(),
      status: this.status,
    };
  }
}

// Global active local simulation session
let activeLocalSim: LocalSimulator | null = null;
let activeBackendSimId: string | null = null;
let isBackendAvailable = false;

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });
    isBackendAvailable = res.ok;
    return isBackendAvailable;
  } catch {
    isBackendAvailable = false;
    return false;
  }
}

export async function checkOllamaStatus(baseUrl = "http://localhost:11434"): Promise<{
  connected: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tm/ollama/status?base_url=${encodeURIComponent(baseUrl)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    try {
      const direct = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`);
      if (direct.ok) {
        const data = await direct.json();
        return {
          connected: true,
          models: (data.models || []).map((m: any) => m.name),
        };
      }
    } catch {
      // Ignore
    }
  }
  return { connected: false, models: [], error: "Ollama server is not reachable on localhost:11434" };
}

export function validateSpecificationLocally(spec: TMSpecification): ValidationResult {
  const errors: any[] = [];
  const warnings: any[] = [];

  const stateSet = new Set(spec.states);

  // Start state
  if (!stateSet.has(spec.start_state)) {
    errors.push({
      code: "UNKNOWN_START_STATE",
      path: "start_state",
      message: `Start state '${spec.start_state}' is not in states list.`,
      severity: "error",
    });
  }

  // Accept states
  for (const s of spec.accept_states) {
    if (!stateSet.has(s)) {
      errors.push({
        code: "UNKNOWN_ACCEPT_STATE",
        path: "accept_states",
        message: `Accept state '${s}' is not declared in states.`,
        severity: "error",
      });
    }
  }

  // Reject states
  for (const s of spec.reject_states) {
    if (!stateSet.has(s)) {
      errors.push({
        code: "UNKNOWN_REJECT_STATE",
        path: "reject_states",
        message: `Reject state '${s}' is not declared in states.`,
        severity: "error",
      });
    }
  }

  // Overlap
  const overlap = spec.accept_states.filter((s) => spec.reject_states.includes(s));
  if (overlap.length > 0) {
    errors.push({
      code: "OVERLAPPING_HALT_STATES",
      path: "accept_states,reject_states",
      message: `States [${overlap.join(", ")}] are declared as both accept and reject states.`,
      severity: "error",
    });
  }

  // Alphabets
  const tapeSet = new Set(spec.tape_alphabet);
  const inputSet = new Set(spec.input_alphabet);

  if (!tapeSet.has(spec.blank_symbol)) {
    errors.push({
      code: "BLANK_NOT_IN_TAPE_ALPHABET",
      path: "blank_symbol",
      message: `Blank symbol '${spec.blank_symbol}' must be in tape_alphabet.`,
      severity: "error",
    });
  }

  if (inputSet.has(spec.blank_symbol)) {
    errors.push({
      code: "BLANK_IN_INPUT_ALPHABET",
      path: "input_alphabet",
      message: `Blank symbol '${spec.blank_symbol}' cannot be an input symbol.`,
      severity: "error",
    });
  }

  for (const sym of spec.input_alphabet) {
    if (!tapeSet.has(sym)) {
      errors.push({
        code: "INPUT_ALPHABET_NOT_SUBSET",
        path: "input_alphabet",
        message: `Input symbol '${sym}' is not included in tape_alphabet.`,
        severity: "error",
      });
    }
  }

  // Determinism & transitions
  const seenTransitions = new Set<string>();
  for (let i = 0; i < spec.transitions.length; i++) {
    const t = spec.transitions[i];
    if (!stateSet.has(t.state)) {
      errors.push({
        code: "UNKNOWN_STATE",
        path: `transitions[${i}].state`,
        message: `Source state '${t.state}' is undeclared.`,
        severity: "error",
      });
    }
    if (!stateSet.has(t.next_state)) {
      errors.push({
        code: "UNKNOWN_STATE",
        path: `transitions[${i}].next_state`,
        message: `Next state '${t.next_state}' is undeclared.`,
        severity: "error",
      });
    }
    if (!tapeSet.has(t.read)) {
      errors.push({
        code: "INVALID_TAPE_SYMBOL",
        path: `transitions[${i}].read`,
        message: `Read symbol '${t.read}' is not in tape alphabet.`,
        severity: "error",
      });
    }
    if (!tapeSet.has(t.write)) {
      errors.push({
        code: "INVALID_TAPE_SYMBOL",
        path: `transitions[${i}].write`,
        message: `Write symbol '${t.write}' is not in tape alphabet.`,
        severity: "error",
      });
    }

    const key = `${t.state}:::${t.read}`;
    if (seenTransitions.has(key)) {
      errors.push({
        code: "DUPLICATE_TRANSITION",
        path: `transitions[${i}]`,
        message: `Non-deterministic duplicate transition for (${t.state}, '${t.read}').`,
        severity: "error",
      });
    } else {
      seenTransitions.add(key);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function compileMachine(params: {
  prompt: string;
  provider: "mock" | "ollama" | "hosted";
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  clarificationAnswers?: string;
}): Promise<CompilerResponse> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tm/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: params.prompt,
        provider: params.provider,
        model: params.model,
        base_url: params.baseUrl,
        api_key: params.apiKey,
        clarification_answers: params.clarificationAnswers,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Local fallback
  }

  // Local fallback mock compiler
  const p = params.prompt.toLowerCase();
  if (p.includes("palindrome")) {
    return {
      status: "success",
      clarification_questions: [],
      assumptions: ["Input is over binary alphabet {0, 1}."],
      machine_spec: {
        schema_version: "1.0",
        name: "Binary Palindrome Recognizer",
        description: "Recognizes binary palindromes.",
        machine_type: "deterministic_single_tape",
        states: ["q0", "q_saw0", "q_saw1", "q_check0", "q_check1", "q_back", "q_accept", "q_reject"],
        input_alphabet: ["0", "1"],
        tape_alphabet: ["0", "1", "_"],
        blank_symbol: "_",
        start_state: "q0",
        accept_states: ["q_accept"],
        reject_states: ["q_reject"],
        transitions: [
          { state: "q0", read: "0", write: "_", move: "R", next_state: "q_saw0" },
          { state: "q0", read: "1", write: "_", move: "R", next_state: "q_saw1" },
          { state: "q0", read: "_", write: "_", move: "S", next_state: "q_accept" },
          { state: "q_saw0", read: "0", write: "0", move: "R", next_state: "q_saw0" },
          { state: "q_saw0", read: "1", write: "1", move: "R", next_state: "q_saw0" },
          { state: "q_saw0", read: "_", write: "_", move: "L", next_state: "q_check0" },
          { state: "q_check0", read: "0", write: "_", move: "L", next_state: "q_back" },
          { state: "q_check0", read: "_", write: "_", move: "S", next_state: "q_accept" },
          { state: "q_check0", read: "1", write: "1", move: "S", next_state: "q_reject" },
          { state: "q_saw1", read: "0", write: "0", move: "R", next_state: "q_saw1" },
          { state: "q_saw1", read: "1", write: "1", move: "R", next_state: "q_saw1" },
          { state: "q_saw1", read: "_", write: "_", move: "L", next_state: "q_check1" },
          { state: "q_check1", read: "1", write: "_", move: "L", next_state: "q_back" },
          { state: "q_check1", read: "_", write: "_", move: "S", next_state: "q_accept" },
          { state: "q_check1", read: "0", write: "0", move: "S", next_state: "q_reject" },
          { state: "q_back", read: "0", write: "0", move: "L", next_state: "q_back" },
          { state: "q_back", read: "1", write: "1", move: "L", next_state: "q_back" },
          { state: "q_back", read: "_", write: "_", move: "R", next_state: "q0" },
        ],
      },
    };
  }

  if (p.includes("increment") || p.includes("add 1")) {
    return {
      status: "success",
      clarification_questions: [],
      assumptions: ["Input is a binary number."],
      machine_spec: {
        schema_version: "1.0",
        name: "Binary Incrementer",
        description: "Adds 1 to binary number.",
        machine_type: "deterministic_single_tape",
        states: ["q_scan", "q_carry", "q_halt"],
        input_alphabet: ["0", "1"],
        tape_alphabet: ["0", "1", "_"],
        blank_symbol: "_",
        start_state: "q_scan",
        accept_states: ["q_halt"],
        reject_states: [],
        transitions: [
          { state: "q_scan", read: "0", write: "0", move: "R", next_state: "q_scan" },
          { state: "q_scan", read: "1", write: "1", move: "R", next_state: "q_scan" },
          { state: "q_scan", read: "_", write: "_", move: "L", next_state: "q_carry" },
          { state: "q_carry", read: "0", write: "1", move: "S", next_state: "q_halt" },
          { state: "q_carry", read: "1", write: "0", move: "L", next_state: "q_carry" },
          { state: "q_carry", read: "_", write: "1", move: "S", next_state: "q_halt" },
        ],
      },
    };
  }

  if (p.includes("something") || p.includes("maybe") || p.includes("some string")) {
    return {
      status: "needs_clarification",
      clarification_questions: [
        "What is the input alphabet (e.g. {0,1})?",
        "What are the precise conditions for accepting or rejecting?",
      ],
      assumptions: [],
      machine_spec: null,
    };
  }

  // Default: Even 1s
  return {
    status: "success",
    clarification_questions: [],
    assumptions: ["Binary alphabet {0, 1}; accepts even count of 1s."],
    machine_spec: {
      schema_version: "1.0",
      name: "Even Number of Ones",
      description: "Accepts binary strings containing an even number of 1s.",
      machine_type: "deterministic_single_tape",
      states: ["q_even", "q_odd", "q_accept", "q_reject"],
      input_alphabet: ["0", "1"],
      tape_alphabet: ["0", "1", "_"],
      blank_symbol: "_",
      start_state: "q_even",
      accept_states: ["q_accept"],
      reject_states: ["q_reject"],
      transitions: [
        { state: "q_even", read: "0", write: "0", move: "R", next_state: "q_even" },
        { state: "q_even", read: "1", write: "1", move: "R", next_state: "q_odd" },
        { state: "q_even", read: "_", write: "_", move: "S", next_state: "q_accept" },
        { state: "q_odd", read: "0", write: "0", move: "R", next_state: "q_odd" },
        { state: "q_odd", read: "1", write: "1", move: "R", next_state: "q_even" },
        { state: "q_odd", read: "_", write: "_", move: "S", next_state: "q_reject" },
      ],
    },
  };
}

export async function createSimulation(
  spec: TMSpecification,
  inputString: string
): Promise<{ simulation_id: string; configuration: ConfigurationView; status: SimulationStatus }> {
  // Always initialize local simulation engine
  activeLocalSim = new LocalSimulator(spec);
  const localConfig = activeLocalSim.initialize(inputString);

  // Try backend
  try {
    const res = await fetch(`${BACKEND_URL}/api/tm/simulation/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machine_spec: spec, input_string: inputString }),
    });
    if (res.ok) {
      const data = await res.json();
      activeBackendSimId = data.simulation_id;
      return data;
    }
  } catch {
    // Backend offline
  }

  activeBackendSimId = null;
  return {
    simulation_id: "local-sim",
    configuration: localConfig,
    status: activeLocalSim.status,
  };
}

export async function stepSimulation(): Promise<{
  step_number: number;
  configuration: ConfigurationView;
  transition_applied: Transition | null;
  status: SimulationStatus;
}> {
  if (activeBackendSimId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/simulation/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: activeBackendSimId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local
    }
  }

  if (!activeLocalSim) {
    throw new Error("No active simulation");
  }
  return activeLocalSim.step();
}

export async function stepBackSimulation(): Promise<{
  step_number: number;
  configuration: ConfigurationView;
  status: SimulationStatus;
}> {
  if (activeBackendSimId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/simulation/step_back`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: activeBackendSimId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
  }

  if (!activeLocalSim) {
    throw new Error("No active simulation");
  }
  return activeLocalSim.stepBack();
}

export async function runSimulation(maxSteps = 5000): Promise<{
  steps_executed: number;
  final_configuration: ConfigurationView;
  status: SimulationStatus;
}> {
  if (activeBackendSimId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/simulation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: activeBackendSimId, max_steps: maxSteps }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
  }

  if (!activeLocalSim) {
    throw new Error("No active simulation");
  }

  let count = 0;
  while (activeLocalSim.status === "RUNNING" && count < maxSteps) {
    activeLocalSim.step();
    count++;
  }

  return {
    steps_executed: count,
    final_configuration: activeLocalSim.getConfigView(),
    status: activeLocalSim.status,
  };
}

export async function resetSimulation(): Promise<{
  configuration: ConfigurationView;
  status: SimulationStatus;
}> {
  if (activeBackendSimId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/simulation/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_id: activeBackendSimId }),
      });
      if (res.ok) {
        const data = await res.json();
        return { configuration: data.configuration, status: data.status };
      }
    } catch {
      // Fallback
    }
  }

  if (!activeLocalSim) {
    throw new Error("No active simulation");
  }
  const config = activeLocalSim.initialize(activeLocalSim.inputString);
  return {
    configuration: config,
    status: activeLocalSim.status,
  };
}

export async function getTrace(): Promise<TraceEntryView[]> {
  if (activeBackendSimId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/tm/simulation/trace?simulation_id=${activeBackendSimId}`
      );
      if (res.ok) {
        const data = await res.json();
        return data.trace;
      }
    } catch {
      // Fallback
    }
  }

  return activeLocalSim ? activeLocalSim.trace : [];
}

// Project management with localStorage + backend sync
const LOCAL_STORAGE_PROJECTS_KEY = "turing_studio_projects_v1";

export async function listSavedProjects(): Promise<ProjectRecord[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/projects`);
    if (res.ok) {
      const rows = await res.json();
      return rows;
    }
  } catch {
    // Backend offline
  }

  const raw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveProjectRecord(project: ProjectRecord): Promise<void> {
  // Sync to localStorage
  const existing = await listSavedProjects();
  const idx = existing.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    existing[idx] = project;
  } else {
    existing.unshift(project);
  }
  localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(existing));

  // Sync to backend if online
  try {
    await fetch(`${BACKEND_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
  } catch {
    // Ignore if offline
  }
}

export async function deleteProjectRecord(id: string): Promise<void> {
  const existing = await listSavedProjects();
  const filtered = existing.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(filtered));

  try {
    await fetch(`${BACKEND_URL}/api/projects/${id}`, { method: "DELETE" });
  } catch {
    // Ignore
  }
}
