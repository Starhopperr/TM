import React, { useState } from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import type { CompilerResponse } from "../types/tm";

interface PromptEditorProps {
  onCompile: (prompt: string, provider: "mock" | "ollama" | "hosted") => Promise<void>;
  isCompiling: boolean;
  lastCompilerResponse: CompilerResponse | null;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  onCompile,
  isCompiling,
  lastCompilerResponse,
}) => {
  const [promptText, setPromptText] = useState<string>(
    "Accept binary strings containing an even number of 1s."
  );
  const [provider, setProvider] = useState<"mock" | "ollama" | "hosted">("mock");

  const handleCompileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isCompiling) return;
    onCompile(promptText.trim(), provider);
  };

  return (
    <div className="prompt-editor-card">
      <form onSubmit={handleCompileSubmit} className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sparkles size={14} className="text-cyan-400" />
            <span>Natural-Language Turing Machine Synthesizer</span>
          </div>

          {/* Provider Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Compiler Engine:</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="speed-dropdown text-xs"
            >
              <option value="mock">Built-in Synthesizer (Instant & Offline)</option>
              <option value="ollama">Ollama (Local LLM: localhost:11434)</option>
              <option value="hosted">Hosted API (OpenAI / Gemini / Groq)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe what the Turing machine should do (e.g. 'Recognize binary palindromes' or 'Add 1 to binary number')..."
            className="input-text flex-1 text-sm font-sans"
          />
          <button
            type="submit"
            disabled={isCompiling || !promptText.trim()}
            className="btn-primary flex items-center gap-2 px-4 whitespace-nowrap"
          >
            {isCompiling ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Compiling IR...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Synthesize TM</span>
              </>
            )}
          </button>
        </div>

        {/* Compiler feedback and assumptions */}
        {lastCompilerResponse && lastCompilerResponse.status === "success" && lastCompilerResponse.assumptions.length > 0 && (
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-md text-xs text-slate-300 flex items-start gap-2">
            <Info size={14} className="text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Compiler Assumptions: </span>
              {lastCompilerResponse.assumptions.join(" ")}
            </div>
          </div>
        )}

        {lastCompilerResponse && lastCompilerResponse.status === "error" && (
          <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-md text-xs text-rose-300">
            <strong>Compilation Failed: </strong>
            {lastCompilerResponse.error_message || "Unknown error during compilation."}
          </div>
        )}
      </form>
    </div>
  );
};
