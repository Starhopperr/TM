import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "./components/Header";
import { PromptEditor } from "./components/PromptEditor";
import { ClarificationModal } from "./components/ClarificationModal";
import { StatePanel } from "./components/StatePanel";
import { TapeViewport } from "./components/TapeViewport";
import { PlaybackControls } from "./components/PlaybackControls";
import { MachineSpecEditor } from "./components/MachineSpecEditor";
import { TracePanel } from "./components/TracePanel";
import { SettingsModal } from "./components/SettingsModal";
import { ProjectsModal } from "./components/ProjectsModal";

import type {
  TMSpecification,
  ConfigurationView,
  Transition,
  ValidationResult,
  TraceEntryView,
  CompilerResponse,
  ProjectRecord,
} from "./types/tm";
import { PRESET_MACHINES } from "./data/presets";
import type { PresetMachine } from "./data/presets";
import {
  checkBackendHealth,
  validateSpecificationLocally,
  compileMachine,
  createSimulation,
  stepSimulation,
  stepBackSimulation,
  runSimulation,
  resetSimulation,
  getTrace,
} from "./services/api";

export const App: React.FC = () => {
  // Machine specification & input
  const defaultPreset = PRESET_MACHINES[0];
  const [spec, setSpec] = useState<TMSpecification>(defaultPreset.spec);
  const [inputString, setInputString] = useState<string>(defaultPreset.defaultInput);

  // Runtime State
  const [configuration, setConfiguration] = useState<ConfigurationView | null>(null);
  const [lastTransition, setLastTransition] = useState<Transition | null>(null);
  const [trace, setTrace] = useState<TraceEntryView[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(300);
  const [breakpoints, setBreakpoints] = useState<string[]>([]);

  // Compiler State
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [lastCompilerResponse, setLastCompilerResponse] = useState<CompilerResponse | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string>("");

  // Modals & Options
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [ollamaUrl, setOllamaUrl] = useState<string>("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState<string>("llama3.2:3b");
  const [hostedApiKey, setHostedApiKey] = useState<string>("");
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  const playTimerRef = useRef<number | null>(null);

  // Periodic Backend Health Check
  useEffect(() => {
    const check = async () => {
      const ok = await checkBackendHealth();
      setIsBackendConnected(ok);
    };
    check();
    const interval = window.setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Live Specification Validation
  const validationResult: ValidationResult = React.useMemo(() => {
    return validateSpecificationLocally(spec);
  }, [spec]);

  // Initialize or restart simulation session
  const initializeSimulationSession = useCallback(
    async (targetSpec: TMSpecification, targetInput: string) => {
      try {
        const res = await createSimulation(targetSpec, targetInput);
        setConfiguration(res.configuration);
        setLastTransition(null);
        setTrace([]);
        setIsPlaying(false);
      } catch (e: any) {
        console.error("Simulation initialization error:", e);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    initializeSimulationSession(spec, inputString);
  }, []);

  // Step Forward
  const handleStep = async () => {
    if (configuration && configuration.status !== "RUNNING") return;
    try {
      const stepRes = await stepSimulation();
      setConfiguration(stepRes.configuration);
      if (stepRes.transition_applied) {
        setLastTransition(stepRes.transition_applied);
      }
      const updatedTrace = await getTrace();
      setTrace(updatedTrace);

      // Check state breakpoints
      if (breakpoints.includes(stepRes.configuration.current_state)) {
        setIsPlaying(false);
      }
      if (stepRes.status !== "RUNNING") {
        setIsPlaying(false);
      }
    } catch (e) {
      console.error("Step execution failed", e);
      setIsPlaying(false);
    }
  };

  // Step Back (Undo)
  const handleStepBack = async () => {
    if (isPlaying) setIsPlaying(false);
    try {
      const backRes = await stepBackSimulation();
      setConfiguration(backRes.configuration);
      const updatedTrace = await getTrace();
      setTrace(updatedTrace);
      const last = updatedTrace[updatedTrace.length - 1];
      if (last) {
        setLastTransition({
          state: last.state_before,
          read: last.read_symbol,
          write: last.write_symbol,
          move: last.move as any,
          next_state: last.state_after,
        });
      } else {
        setLastTransition(null);
      }
    } catch (e) {
      console.error("Step back failed", e);
    }
  };

  // Play / Pause timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = window.setInterval(() => {
        handleStep();
      }, speed);
    } else {
      if (playTimerRef.current !== null) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current !== null) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, speed, configuration, breakpoints]);

  const handlePlay = () => {
    if (configuration?.status === "RUNNING") {
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  // Run to End
  const handleRunToEnd = async () => {
    setIsPlaying(false);
    try {
      const res = await runSimulation(5000);
      setConfiguration(res.final_configuration);
      const updatedTrace = await getTrace();
      setTrace(updatedTrace);
      const last = updatedTrace[updatedTrace.length - 1];
      if (last) {
        setLastTransition({
          state: last.state_before,
          read: last.read_symbol,
          write: last.write_symbol,
          move: last.move as any,
          next_state: last.state_after,
        });
      }
    } catch (e) {
      console.error("Run to end failed", e);
    }
  };

  // Reset
  const handleReset = async () => {
    setIsPlaying(false);
    try {
      const res = await resetSimulation();
      setConfiguration(res.configuration);
      setLastTransition(null);
      const updatedTrace = await getTrace();
      setTrace(updatedTrace);
    } catch (e) {
      console.error("Reset failed", e);
    }
  };

  // Change preset machine
  const handleSelectPreset = (preset: PresetMachine) => {
    setIsPlaying(false);
    setSpec(preset.spec);
    setInputString(preset.defaultInput);
    initializeSimulationSession(preset.spec, preset.defaultInput);
  };

  // Natural Language Compilation
  const handleCompile = async (
    prompt: string,
    provider: "mock" | "ollama" | "hosted",
    clarificationAnswers = ""
  ) => {
    setIsCompiling(true);
    setPendingPrompt(prompt);
    try {
      const res = await compileMachine({
        prompt,
        provider,
        model: provider === "ollama" ? ollamaModel : undefined,
        baseUrl: ollamaUrl,
        apiKey: hostedApiKey,
        clarificationAnswers,
      });

      setLastCompilerResponse(res);

      if (res.status === "needs_clarification") {
        setClarificationQuestions(res.clarification_questions);
      } else if (res.status === "success" && res.machine_spec) {
        setSpec(res.machine_spec);
        setClarificationQuestions([]);
        // Re-initialize with current input
        initializeSimulationSession(res.machine_spec, inputString);
      }
    } catch (e: any) {
      setLastCompilerResponse({
        status: "error",
        clarification_questions: [],
        assumptions: [],
        error_message: e.message,
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleClarificationSubmit = (answers: string) => {
    setClarificationQuestions([]);
    handleCompile(pendingPrompt, "mock", answers);
  };

  // Breakpoints
  const handleToggleBreakpoint = (st: string) => {
    setBreakpoints((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  // Load project
  const handleLoadProject = (proj: ProjectRecord) => {
    setSpec(proj.machine_spec);
    setInputString(proj.input_string);
    initializeSimulationSession(proj.machine_spec, proj.input_string);
  };

  return (
    <div className="app-layout">
      {/* Top Application Header */}
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        {/* Natural Language Prompt & Synthesizer */}
        <PromptEditor
          onCompile={(prompt, provider) => handleCompile(prompt, provider)}
          isCompiling={isCompiling}
          lastCompilerResponse={lastCompilerResponse}
        />

        {/* Tape Viewport (Hero Visualization) */}
        <TapeViewport
          configuration={configuration}
          blankSymbol={spec.blank_symbol}
          reducedMotion={reducedMotion}
        />

        {/* Playback & Step Controls */}
        <PlaybackControls
          status={configuration?.status ?? "RUNNING"}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={handlePlay}
          onPause={handlePause}
          onStep={handleStep}
          onStepBack={handleStepBack}
          onRunToEnd={handleRunToEnd}
          onReset={handleReset}
          onSpeedChange={(s) => setSpeed(s)}
          canStepBack={(configuration?.step_number ?? 0) > 0}
        />

        {/* Middle Two-Column Grid: Specification Editor + Runtime Status */}
        <div className="app-two-column-grid">
          {/* Left: Formal Machine Specification & Transition Table */}
          <MachineSpecEditor
            spec={spec}
            onChange={(updated) => {
              setSpec(updated);
              initializeSimulationSession(updated, inputString);
            }}
            validationResult={validationResult}
            onImportJSON={(jsonStr) => {
              try {
                const parsed = JSON.parse(jsonStr);
                setSpec(parsed);
                initializeSimulationSession(parsed, inputString);
              } catch (e) {
                alert("Invalid JSON format");
              }
            }}
          />

          {/* Right: Runtime State Metrics, Formula & Input String */}
          <div className="space-y-4">
            <StatePanel
              configuration={configuration}
              spec={spec}
              inputString={inputString}
              onInputChange={(val) => setInputString(val)}
              onLoadInput={() => initializeSimulationSession(spec, inputString)}
              lastTransition={lastTransition}
            />

            {/* Execution Trace & Breakpoint Diagnostics */}
            <TracePanel
              trace={trace}
              activeStep={configuration?.step_number ?? 0}
              breakpoints={breakpoints}
              onToggleBreakpoint={handleToggleBreakpoint}
              allStates={spec.states}
            />
          </div>
        </div>
      </main>

      {/* Clarification Dialogue Modal */}
      {clarificationQuestions.length > 0 && (
        <ClarificationModal
          questions={clarificationQuestions}
          onSubmit={handleClarificationSubmit}
          onCancel={() => setClarificationQuestions([])}
        />
      )}

      {/* Projects Modal */}
      {isProjectsOpen && (
        <ProjectsModal
          currentSpec={spec}
          currentInput={inputString}
          onLoadProject={handleLoadProject}
          onClose={() => setIsProjectsOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          reducedMotion={reducedMotion}
          onToggleReducedMotion={setReducedMotion}
          ollamaUrl={ollamaUrl}
          onOllamaUrlChange={setOllamaUrl}
          ollamaModel={ollamaModel}
          onOllamaModelChange={setOllamaModel}
          hostedApiKey={hostedApiKey}
          onHostedApiKeyChange={setHostedApiKey}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
