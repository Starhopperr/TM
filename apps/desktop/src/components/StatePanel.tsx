import React, { useState, useEffect } from "react";
import type {
  ConfigurationView,
  TMSpecification,
  Transition,
} from "../types/tm";
import { CheckCircle2, XCircle, AlertCircle, Clock, PlayCircle, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface StatePanelProps {
  configuration: ConfigurationView | null;
  spec: TMSpecification;
  inputString: string;
  onInputChange: (newInput: string) => void;
  onLoadInput: () => void;
  lastTransition: Transition | null;
}

export const StatePanel: React.FC<StatePanelProps> = ({
  configuration,
  spec,
  inputString,
  onInputChange,
  onLoadInput,
  lastTransition,
}) => {
  const [localInput, setLocalInput] = useState<string>(inputString);
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    setLocalInput(inputString);
  }, [inputString]);

  const handleInputChange = (val: string) => {
    setLocalInput(val);
    // Validate symbols against spec.input_alphabet
    const allowed = new Set(spec.input_alphabet);
    const invalidChar = Array.from(val).find((c) => !allowed.has(c));
    if (invalidChar) {
      setInputError(`'${invalidChar}' not in input alphabet {${spec.input_alphabet.join(", ")}}`);
    } else {
      setInputError(null);
    }
  };

  const handleApplyInput = () => {
    if (inputError) return;
    onInputChange(localInput);
    onLoadInput();
  };

  const status = configuration?.status ?? "RUNNING";
  const stepNumber = configuration?.step_number ?? 0;
  const currentState = configuration?.current_state ?? spec.start_state;
  const headPos = configuration?.head_position ?? 0;

  // Read symbol under head
  const currentReadSymbol =
    configuration?.visible_tape.find((c) => c.index === headPos)?.symbol ?? spec.blank_symbol;

  // Trigger celebration confetti on ACCEPT state
  useEffect(() => {
    if (status === "ACCEPT") {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#10b981", "#3b82f6", "#6366f1"],
        });
      } catch {
        // Safe ignore
      }
    }
  }, [status]);

  const getStatusBadge = () => {
    switch (status) {
      case "ACCEPT":
        return (
          <div className="status-badge status-accept">
            <CheckCircle2 size={16} />
            <span>ACCEPTED</span>
          </div>
        );
      case "REJECT":
        return (
          <div className="status-badge status-reject">
            <XCircle size={16} />
            <span>REJECTED</span>
          </div>
        );
      case "HALTED_UNDEFINED_TRANSITION":
        return (
          <div className="status-badge status-halted">
            <AlertCircle size={16} />
            <span>HALTED (No Transition)</span>
          </div>
        );
      case "TIMEOUT":
        return (
          <div className="status-badge status-timeout">
            <Clock size={16} />
            <span>TIMEOUT (Step Limit)</span>
          </div>
        );
      case "RUNNING":
      default:
        return (
          <div className="status-badge status-running">
            <PlayCircle size={16} />
            <span>SIMULATING</span>
          </div>
        );
    }
  };

  return (
    <div className="state-panel-card">
      <div className="panel-header">
        <span className="section-title">Runtime Configuration</span>
        {getStatusBadge()}
      </div>

      <div className="state-metrics-grid">
        {/* Current State */}
        <div className="metric-box">
          <span className="metric-label">Current State (q)</span>
          <span className="metric-value font-mono text-cyan-400 font-bold">{currentState}</span>
        </div>

        {/* Step Counter */}
        <div className="metric-box">
          <span className="metric-label">Step Count (#)</span>
          <span className="metric-value font-mono text-slate-100">{stepNumber}</span>
        </div>

        {/* Head Position */}
        <div className="metric-box">
          <span className="metric-label">Head Index</span>
          <span className="metric-value font-mono text-sky-400">{headPos}</span>
        </div>

        {/* Symbol Under Head */}
        <div className="metric-box">
          <span className="metric-label">Read Symbol (a)</span>
          <span className="metric-value font-mono text-amber-300">
            {currentReadSymbol === spec.blank_symbol ? `_ (${spec.blank_symbol})` : currentReadSymbol}
          </span>
        </div>
      </div>

      {/* Applied Transition Formula */}
      <div className="transition-formula-box">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 block">
          Applied Transition:
        </span>
        {lastTransition ? (
          <div className="font-mono text-sm text-cyan-300 flex items-center gap-1.5 flex-wrap">
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              δ({lastTransition.state}, '{lastTransition.read}')
            </span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              ({lastTransition.next_state}, '{lastTransition.write}', {lastTransition.move})
            </span>
          </div>
        ) : (
          <span className="font-mono text-sm text-slate-500 italic">
            Initial configuration (no transitions applied yet)
          </span>
        )}
      </div>

      {/* Input String Initialization */}
      <div className="input-string-container">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Input String (Σ = &#123;{spec.input_alphabet.join(", ")}&#125;)
          </label>
          <span className="text-xs text-slate-400">Length: {localInput.length}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={localInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyInput();
            }}
            placeholder="e.g. 1010 or empty string"
            className={`input-text font-mono flex-1 ${inputError ? "input-error" : ""}`}
          />
          <button
            onClick={handleApplyInput}
            disabled={!!inputError}
            className="btn-primary whitespace-nowrap"
          >
            Load on Tape
          </button>
        </div>
        {inputError && <span className="text-xs text-red-400 mt-1 block font-medium">{inputError}</span>}
      </div>
    </div>
  );
};
