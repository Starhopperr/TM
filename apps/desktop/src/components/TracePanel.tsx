import React, { useState } from "react";
import type { TraceEntryView } from "../types/tm";
import { History, Target, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface TracePanelProps {
  trace: TraceEntryView[];
  activeStep: number;
  onSelectTraceStep?: (step: number) => void;
  breakpoints: string[];
  onToggleBreakpoint: (state: string) => void;
  allStates: string[];
}

export const TracePanel: React.FC<TracePanelProps> = ({
  trace,
  activeStep,
  onSelectTraceStep,
  breakpoints,
  onToggleBreakpoint,
  allStates,
}) => {
  const [activeTab, setActiveTab] = useState<"trace" | "breakpoints">("trace");

  return (
    <div className="trace-card">
      <div className="trace-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <History size={15} className="text-cyan-400" />
            <span>Execution Trace & Diagnostics</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">({trace.length} total steps)</span>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setActiveTab("trace")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTab === "trace"
                ? "bg-slate-800 text-cyan-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            History Log ({trace.length})
          </button>
          <button
            onClick={() => setActiveTab("breakpoints")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTab === "breakpoints"
                ? "bg-slate-800 text-cyan-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Breakpoints ({breakpoints.length})
          </button>
        </div>
      </div>

      {activeTab === "trace" ? (
        <div className="trace-table-container">
          {trace.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono italic">
              Simulation trace empty. Press Step, Play, or Run to record execution history.
            </div>
          ) : (
            <table className="trace-table">
              <thead>
                <tr>
                  <th className="w-14">#Step</th>
                  <th>State Flow</th>
                  <th>Head Flow</th>
                  <th>Read → Write</th>
                  <th>Move</th>
                  <th>Transition δ</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {trace.map((entry) => {
                  const isCurrent = entry.step_number === activeStep;
                  return (
                    <tr
                      key={entry.step_number}
                      onClick={() => onSelectTraceStep?.(entry.step_number)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent ? "bg-cyan-950/40 border-l-2 border-cyan-400" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="font-mono text-slate-400">#{entry.step_number}</td>
                      <td>
                        <span className="font-mono text-cyan-300 font-medium">{entry.state_before}</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="font-mono text-sky-400 font-medium">{entry.state_after}</span>
                      </td>
                      <td className="font-mono text-xs text-slate-300">
                        [{entry.head_position_before}] → [{entry.head_position_after}]
                      </td>
                      <td>
                        <span className="font-mono text-amber-300 font-bold">'{entry.read_symbol}'</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="font-mono text-emerald-300 font-bold">'{entry.write_symbol}'</span>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-sky-400 px-1 py-0.5 bg-slate-800 rounded">
                          {entry.move}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-300">{entry.transition_str}</td>
                      <td>
                        {entry.outcome === "ACCEPT" && (
                          <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} /> ACCEPT
                          </span>
                        )}
                        {entry.outcome === "REJECT" && (
                          <span className="text-rose-400 text-xs font-bold flex items-center gap-1">
                            <XCircle size={13} /> REJECT
                          </span>
                        )}
                        {entry.outcome === "HALTED_UNDEFINED_TRANSITION" && (
                          <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={13} /> HALTED
                          </span>
                        )}
                        {entry.outcome === "TIMEOUT" && (
                          <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                            <Clock size={13} /> TIMEOUT
                          </span>
                        )}
                        {!entry.outcome && <span className="text-slate-500 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-400">
            Select states to pause simulation before or upon entering:
          </p>
          <div className="flex flex-wrap gap-2">
            {allStates.map((st) => {
              const active = breakpoints.includes(st);
              return (
                <button
                  key={st}
                  onClick={() => onToggleBreakpoint(st)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? "bg-rose-950/80 text-rose-300 border border-rose-600 shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Target size={13} className={active ? "text-rose-400" : "text-slate-500"} />
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
