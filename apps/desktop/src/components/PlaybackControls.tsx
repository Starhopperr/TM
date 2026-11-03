import React, { useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  FastForward,
  Gauge,
  Keyboard,
} from "lucide-react";
import type { SimulationStatus } from "../types/tm";

interface PlaybackControlsProps {
  status: SimulationStatus;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onRunToEnd: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  canStepBack: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  status,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onRunToEnd,
  onReset,
  onSpeedChange,
  canStepBack,
}) => {
  const isHalted = status !== "RUNNING";

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) onPause();
        else if (!isHalted) onPlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (!isHalted && !isPlaying) onStep();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (canStepBack && !isPlaying) onStepBack();
      } else if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isHalted, canStepBack, onPlay, onPause, onStep, onStepBack, onReset]);

  return (
    <div className="playback-toolbar">
      <div className="playback-buttons-group">
        {/* Reset */}
        <button
          onClick={onReset}
          className="btn-toolbar"
          title="Reset machine to initial tape (Key: R)"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        {/* Step Back (Undo) */}
        <button
          onClick={onStepBack}
          disabled={!canStepBack || isPlaying}
          className="btn-toolbar"
          title="Step Back / Undo previous transition (Key: Left Arrow)"
        >
          <SkipBack size={16} />
          <span>Back</span>
        </button>

        {/* Play / Pause */}
        {isPlaying ? (
          <button
            onClick={onPause}
            className="btn-toolbar btn-primary-pause"
            title="Pause continuous simulation (Key: Space)"
          >
            <Pause size={17} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isHalted}
            className="btn-toolbar btn-primary-play"
            title="Play continuous simulation (Key: Space)"
          >
            <Play size={17} />
            <span>Play</span>
          </button>
        )}

        {/* Step Forward */}
        <button
          onClick={onStep}
          disabled={isHalted || isPlaying}
          className="btn-toolbar"
          title="Execute exactly 1 transition step (Key: Right Arrow)"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>

        {/* Run to End */}
        <button
          onClick={onRunToEnd}
          disabled={isHalted || isPlaying}
          className="btn-toolbar"
          title="Run continuously to halt, breakpoint, or limit"
        >
          <FastForward size={16} />
          <span>Run</span>
        </button>
      </div>

      {/* Speed & Shortcuts Group */}
      <div className="playback-speed-group">
        <div className="speed-selector">
          <Gauge size={15} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="speed-dropdown"
          >
            <option value={800}>Slow (800ms)</option>
            <option value={300}>Normal (300ms)</option>
            <option value={80}>Fast (80ms)</option>
            <option value={10}>Turbo (10ms)</option>
          </select>
        </div>

        <div className="keyboard-shortcuts-pill" title="Shortcuts: Space=Play/Pause, ←=Back, →=Step, R=Reset">
          <Keyboard size={13} className="mr-1 opacity-70" />
          <span>Keys: Space / ← / → / R</span>
        </div>
      </div>
    </div>
  );
};
