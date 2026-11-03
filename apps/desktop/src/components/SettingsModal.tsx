import React, { useState, useEffect } from "react";
import { Settings, Cpu, Globe, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { checkOllamaStatus } from "../services/api";

interface SettingsModalProps {
  reducedMotion: boolean;
  onToggleReducedMotion: (val: boolean) => void;
  ollamaUrl: string;
  onOllamaUrlChange: (url: string) => void;
  ollamaModel: string;
  onOllamaModelChange: (model: string) => void;
  hostedApiKey: string;
  onHostedApiKeyChange: (key: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  reducedMotion,
  onToggleReducedMotion,
  ollamaUrl,
  onOllamaUrlChange,
  ollamaModel,
  onOllamaModelChange,
  hostedApiKey,
  onHostedApiKeyChange,
  onClose,
}) => {
  const [isCheckingOllama, setIsCheckingOllama] = useState<boolean>(false);
  const [ollamaStatus, setOllamaStatus] = useState<{
    tested: boolean;
    connected: boolean;
    models: string[];
    error?: string;
  }>({
    tested: false,
    connected: false,
    models: [],
  });

  const testOllama = async () => {
    setIsCheckingOllama(true);
    const res = await checkOllamaStatus(ollamaUrl);
    setOllamaStatus({
      tested: true,
      connected: res.connected,
      models: res.models || [],
      error: res.error,
    });
    if (res.connected && res.models && res.models.length > 0 && !res.models.includes(ollamaModel)) {
      onOllamaModelChange(res.models[0]);
    }
    setIsCheckingOllama(false);
  };

  useEffect(() => {
    testOllama();
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-lg">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-cyan-400" />
            <span className="modal-title">Studio Settings & LLM Endpoints</span>
          </div>
          <button onClick={onClose} className="btn-icon">
            ✕
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Reduced Motion Toggle */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Reduced Motion</span>
              <span className="text-xs text-slate-400">
                Disable SVG head movement animations for accessibility.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => onToggleReducedMotion(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Ollama local endpoint */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Cpu size={14} className="text-emerald-400" />
                <span>Ollama Local Server</span>
              </div>
              <button
                onClick={testOllama}
                disabled={isCheckingOllama}
                className="btn-secondary btn-sm flex items-center gap-1 text-[11px]"
              >
                <RefreshCw size={11} className={isCheckingOllama ? "animate-spin" : ""} />
                <span>Test Connection</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 uppercase font-semibold">Server URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => onOllamaUrlChange(e.target.value)}
                placeholder="http://localhost:11434"
                className="input-text text-xs font-mono w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 uppercase font-semibold">Model Name</label>
              {ollamaStatus.models.length > 0 ? (
                <select
                  value={ollamaModel}
                  onChange={(e) => onOllamaModelChange(e.target.value)}
                  className="input-select text-xs font-mono w-full"
                >
                  {ollamaStatus.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => onOllamaModelChange(e.target.value)}
                  placeholder="e.g. llama3.2, llama3, qwen2.5, mistral"
                  className="input-text text-xs font-mono w-full"
                />
              )}
            </div>

            {/* Status indicator */}
            {ollamaStatus.tested && (
              <div
                className={`p-2 rounded text-xs flex items-start gap-1.5 ${
                  ollamaStatus.connected
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800"
                    : "bg-amber-950/40 text-amber-300 border border-amber-800"
                }`}
              >
                {ollamaStatus.connected ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">Ollama Connected!</span> Detected{" "}
                      {ollamaStatus.models.length} model(s): [{ollamaStatus.models.join(", ") || "none"}].
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">Ollama Not Detected at {ollamaUrl}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Run <code className="text-cyan-300 font-mono">ollama serve</code> or start the Ollama desktop app.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hosted LLM API Key */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Globe size={14} className="text-sky-400" />
              <span>Hosted API Key (OpenAI / Groq / Gemini Proxy)</span>
            </div>
            <input
              type="password"
              value={hostedApiKey}
              onChange={(e) => onHostedApiKeyChange(e.target.value)}
              placeholder="sk-..."
              className="input-text text-xs font-mono w-full"
            />
            <span className="text-xs text-slate-500 block">
              Stored locally in browser session. Never uploaded or shared.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
