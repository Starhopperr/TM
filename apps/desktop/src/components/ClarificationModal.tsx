import React, { useState } from "react";
import { HelpCircle, ArrowRight } from "lucide-react";

interface ClarificationModalProps {
  questions: string[];
  onSubmit: (answers: string) => void;
  onCancel: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  questions,
  onSubmit,
  onCancel,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleTextChange = (idx: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [idx]: val }));
  };

  const handleSubmit = () => {
    const combined = questions
      .map((q, idx) => `Q: ${q}\nA: ${answers[idx] || "As standard"}`)
      .join("\n\n");
    onSubmit(combined);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-2 text-amber-400">
            <HelpCircle size={18} />
            <span className="modal-title text-amber-300">Clarification Needed</span>
          </div>
          <button onClick={onCancel} className="btn-icon">
            ✕
          </button>
        </div>

        <div className="modal-body space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            The natural-language compiler detected ambiguity or missing specifications in your description. Please provide brief answers below so a mathematically sound Turing machine can be generated:
          </p>

          {questions.map((q, idx) => (
            <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-semibold text-slate-200 block">
                {idx + 1}. {q}
              </span>
              <input
                type="text"
                value={answers[idx] || ""}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                placeholder="Your clarification (e.g. 'Use input alphabet {0, 1}', or 'Halt and accept at blank')"
                className="input-text text-xs"
              />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary flex items-center gap-1.5">
            <span>Submit Clarification & Compile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
