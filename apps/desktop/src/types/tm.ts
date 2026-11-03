export type MoveDirection = "L" | "R" | "S";

export type MachineType = "deterministic_single_tape";

export interface Transition {
  state: string;
  read: string;
  write: string;
  move: MoveDirection;
  next_state: string;
}

export interface TMSpecification {
  schema_version: string;
  name: string;
  description?: string;
  machine_type: MachineType;
  states: string[];
  input_alphabet: string[];
  tape_alphabet: string[];
  blank_symbol: string;
  start_state: string;
  accept_states: string[];
  reject_states: string[];
  transitions: Transition[];
}

export type SimulationStatus =
  | "RUNNING"
  | "ACCEPT"
  | "REJECT"
  | "HALTED_UNDEFINED_TRANSITION"
  | "TIMEOUT";

export interface TapeCellData {
  index: number;
  symbol: string;
  is_blank: boolean;
}

export interface ConfigurationView {
  step_number: int_or_number;
  current_state: string;
  head_position: number;
  status: SimulationStatus;
  visible_tape: TapeCellData[];
  non_blank_cells: Record<number, string>;
  min_index: number | null;
  max_index: number | null;
}

type int_or_number = number;

export interface TraceEntryView {
  step_number: number;
  state_before: string;
  state_after: string;
  head_position_before: number;
  head_position_after: number;
  read_symbol: string;
  write_symbol: string;
  move: string;
  transition_str: string;
  outcome?: SimulationStatus;
}

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface CompilerResponse {
  status: "success" | "needs_clarification" | "error";
  clarification_questions: string[];
  assumptions: string[];
  machine_spec?: TMSpecification | null;
  error_message?: string | null;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  machine_spec: TMSpecification;
  input_string: string;
  created_at?: string;
  updated_at?: string;
}
