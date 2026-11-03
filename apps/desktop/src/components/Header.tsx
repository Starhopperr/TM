import React from "react";
import {
  Binary,
  FolderKanban,
  Settings,
  BookOpen,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PRESET_MACHINES } from "../data/presets";
import type { PresetMachine } from "../data/presets";

interface HeaderProps {
  onSelectPreset: (preset: PresetMachine) => void;
  onOpenProjects: () => void;
  onOpenSettings: () => void;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenProjects,
  onOpenSettings,
  isBackendConnected,
}) => {
  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <div className="app-logo-box">
            <Binary size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>Turing Studio</span>
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-none">
              Educational Deterministic Computational Model & Simulator
            </p>
          </div>
        </div>
      </div>

      {/* Middle & Right navigation */}
      <div className="flex items-center gap-3">
        {/* Preset Machines Selector */}
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Examples:</span>
          <select
            onChange={(e) => {
              const selected = PRESET_MACHINES.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset(selected);
            }}
            defaultValue=""
            className="speed-dropdown text-xs"
          >
            <option value="" disabled>
              Select Classic Machine...
            </option>
            {PRESET_MACHINES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-divider" />

        {/* Projects Modal Button */}
        <button
          onClick={onOpenProjects}
          className="btn-secondary btn-sm flex items-center gap-1.5"
          title="Open saved projects or save current machine"
        >
          <FolderKanban size={14} />
          <span>Projects</span>
        </button>

        {/* Settings Modal Button */}
        <button
          onClick={onOpenSettings}
          className="btn-secondary btn-sm flex items-center gap-1.5"
          title="Configure endpoints and options"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono border ${
            isBackendConnected
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}
          title={
            isBackendConnected
              ? "Connected to FastAPI local engine"
              : "Running in deterministic browser local-first mode"
          }
        >
          {isBackendConnected ? (
            <>
              <Wifi size={12} className="text-emerald-400" />
              <span>Backend Ready</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-slate-500" />
              <span>Local Engine</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
