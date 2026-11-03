import React, { useState } from "react";
import type {
  TMSpecification,
  Transition,
  ValidationResult,
  MoveDirection,
} from "../types/tm";
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Filter,
} from "lucide-react";

interface MachineSpecEditorProps {
  spec: TMSpecification;
  onChange: (updatedSpec: TMSpecification) => void;
  validationResult: ValidationResult;
  onImportJSON: (jsonString: string) => void;
}

export const MachineSpecEditor: React.FC<MachineSpecEditorProps> = ({
  spec,
  onChange,
  validationResult,
  onImportJSON,
}) => {
  const [filterState, setFilterState] = useState<string>("ALL");
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [rawJsonText, setRawJsonText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

  // New transition row state
  const [newTransState, setNewTransState] = useState<string>(spec.start_state || "");
  const [newTransRead, setNewTransRead] = useState<string>(spec.tape_alphabet[0] || "");
  const [newTransWrite, setNewTransWrite] = useState<string>(spec.tape_alphabet[0] || "");
  const [newTransMove, setNewTransMove] = useState<MoveDirection>("R");
  const [newTransNextState, setNewTransNextState] = useState<string>(spec.start_state || "");

  const handleFieldChange = (field: keyof TMSpecification, value: any) => {
    onChange({
      ...spec,
      [field]: value,
    });
  };

  const handleAddTransition = () => {
    if (!newTransState || !newTransRead || !newTransWrite || !newTransNextState) return;
    const exists = spec.transitions.some(
      (t) => t.state === newTransState && t.read === newTransRead
    );
    if (exists) {
      alert(`A transition for (${newTransState}, '${newTransRead}') already exists! Remove or edit the existing one first.`);
      return;
    }

    const updatedTransitions = [
      ...spec.transitions,
      {
        state: newTransState,
        read: newTransRead,
        write: newTransWrite,
        move: newTransMove,
        next_state: newTransNextState,
      },
    ];
    handleFieldChange("transitions", updatedTransitions);
  };

  const handleDeleteTransition = (index: number) => {
    const updated = spec.transitions.filter((_, i) => i !== index);
    handleFieldChange("transitions", updated);
  };

  const handleUpdateTransitionRow = (
    index: number,
    field: keyof Transition,
    val: any
  ) => {
    const updated = [...spec.transitions];
    updated[index] = { ...updated[index], [field]: val };
    handleFieldChange("transitions", updated);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.name.toLowerCase().replace(/\s+/g, "_")}_tm.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenImportModal = () => {
    setRawJsonText(JSON.stringify(spec, null, 2));
    setImportError(null);
    setShowJsonModal(true);
  };

  const handleApplyImport = () => {
    try {
      JSON.parse(rawJsonText);
      onImportJSON(rawJsonText);
      setShowJsonModal(false);
    } catch (e: any) {
      setImportError(`Invalid JSON: ${e.message}`);
    }
  };

  const filteredTransitions =
    filterState === "ALL"
      ? spec.transitions
      : spec.transitions.filter((t) => t.state === filterState);

  return (
    <div className="spec-editor-card">
      {/* Editor Header */}
      <div className="spec-editor-header">
        <div className="flex items-center gap-2">
          <span className="section-title">Formal Specification & Transitions</span>
          {/* Validation Status Badge */}
          {validationResult.valid ? (
            <button
              onClick={() => setShowValidationModal(true)}
              className="badge-success flex items-center gap-1 cursor-pointer"
              title="Click to view full validation diagnostics"
            >
              <CheckCircle size={13} />
              <span>Valid ({spec.transitions.length} transitions)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowValidationModal(true)}
              className="badge-error flex items-center gap-1 cursor-pointer"
              title="Click to view validation errors"
            >
              <XCircle size={13} />
              <span>{validationResult.errors.length} Errors</span>
            </button>
          )}

          {validationResult.warnings.length > 0 && (
            <button
              onClick={() => setShowValidationModal(true)}
              className="badge-warning flex items-center gap-1 cursor-pointer"
              title="Click to view warnings"
            >
              <AlertTriangle size={13} />
              <span>{validationResult.warnings.length} Warnings</span>
            </button>
          )}
        </div>

        {/* Import/Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenImportModal}
            className="btn-secondary btn-sm"
            title="Edit raw JSON / Import machine specification"
          >
            <Upload size={14} className="mr-1" />
            JSON
          </button>
          <button
            onClick={handleExportJSON}
            className="btn-secondary btn-sm"
            title="Export specification as JSON file"
          >
            <Download size={14} className="mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Machine Core Details */}
      <div className="spec-meta-grid">
        <div className="form-group">
          <label className="form-label">Machine Name</label>
          <input
            type="text"
            value={spec.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="input-text"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Start State (q₀)</label>
          <select
            value={spec.start_state}
            onChange={(e) => handleFieldChange("start_state", e.target.value)}
            className="input-select font-mono"
          >
            {spec.states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Blank Symbol</label>
          <input
            type="text"
            maxLength={1}
            value={spec.blank_symbol}
            onChange={(e) => handleFieldChange("blank_symbol", e.target.value)}
            className="input-text font-mono"
          />
        </div>
      </div>

      {/* Alphabets & States Summary */}
      <div className="spec-alphabets-summary">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">States Q:</span>
          <span className="font-mono text-xs text-sky-300 ml-2">
            [{spec.states.join(", ")}]
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Accept States F:</span>
          <span className="font-mono text-xs text-emerald-300 ml-2">
            [{spec.accept_states.join(", ") || "none"}]
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Reject States:</span>
          <span className="font-mono text-xs text-rose-300 ml-2">
            [{spec.reject_states.join(", ") || "none"}]
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase">Tape Alphabet Γ:</span>
          <span className="font-mono text-xs text-amber-300 ml-2">
            &#123;{spec.tape_alphabet.join(", ")}&#125;
          </span>
        </div>
      </div>

      {/* Transition Table Header & Filter */}
      <div className="transition-table-controls">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filter by State:</span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="speed-dropdown font-mono text-xs"
          >
            <option value="ALL">All States ({spec.transitions.length})</option>
            {spec.states.map((st) => (
              <option key={st} value={st}>
                {st} ({spec.transitions.filter((t) => t.state === st).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transition Table */}
      <div className="transition-table-container">
        <table className="transition-table">
          <thead>
            <tr>
              <th>Current State</th>
              <th>Read (a)</th>
              <th>Write (b)</th>
              <th>Move</th>
              <th>Next State (q')</th>
              <th className="w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransitions.map((t, idx) => {
              // Real index in spec.transitions
              const realIndex = spec.transitions.indexOf(t);
              return (
                <tr key={`${t.state}-${t.read}-${idx}`}>
                  <td>
                    <select
                      value={t.state}
                      onChange={(e) => handleUpdateTransitionRow(realIndex, "state", e.target.value)}
                      className="table-cell-select"
                    >
                      {spec.states.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={t.read}
                      onChange={(e) => handleUpdateTransitionRow(realIndex, "read", e.target.value)}
                      className="table-cell-select"
                    >
                      {spec.tape_alphabet.map((sym) => (
                        <option key={sym} value={sym}>
                          {sym === spec.blank_symbol ? `_ (${spec.blank_symbol})` : sym}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={t.write}
                      onChange={(e) => handleUpdateTransitionRow(realIndex, "write", e.target.value)}
                      className="table-cell-select"
                    >
                      {spec.tape_alphabet.map((sym) => (
                        <option key={sym} value={sym}>
                          {sym === spec.blank_symbol ? `_ (${spec.blank_symbol})` : sym}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={t.move}
                      onChange={(e) =>
                        handleUpdateTransitionRow(realIndex, "move", e.target.value as MoveDirection)
                      }
                      className="table-cell-select font-bold text-sky-400"
                    >
                      <option value="L">L (Left)</option>
                      <option value="R">R (Right)</option>
                      <option value="S">S (Stay)</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={t.next_state}
                      onChange={(e) => handleUpdateTransitionRow(realIndex, "next_state", e.target.value)}
                      className="table-cell-select"
                    >
                      {spec.states.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDeleteTransition(realIndex)}
                      className="btn-icon-danger"
                      title="Delete transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Transition Bar */}
      <div className="add-transition-bar">
        <span className="text-xs text-slate-400 font-semibold mr-2">New Transition:</span>
        <select
          value={newTransState}
          onChange={(e) => setNewTransState(e.target.value)}
          className="table-cell-select"
        >
          {spec.states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <span className="text-slate-500 font-mono">reads</span>
        <select
          value={newTransRead}
          onChange={(e) => setNewTransRead(e.target.value)}
          className="table-cell-select"
        >
          {spec.tape_alphabet.map((sym) => (
            <option key={sym} value={sym}>
              {sym === spec.blank_symbol ? `_ (${spec.blank_symbol})` : sym}
            </option>
          ))}
        </select>
        <span className="text-slate-500 font-mono">→ writes</span>
        <select
          value={newTransWrite}
          onChange={(e) => setNewTransWrite(e.target.value)}
          className="table-cell-select"
        >
          {spec.tape_alphabet.map((sym) => (
            <option key={sym} value={sym}>
              {sym === spec.blank_symbol ? `_ (${spec.blank_symbol})` : sym}
            </option>
          ))}
        </select>
        <select
          value={newTransMove}
          onChange={(e) => setNewTransMove(e.target.value as MoveDirection)}
          className="table-cell-select font-bold text-sky-400"
        >
          <option value="L">L</option>
          <option value="R">R</option>
          <option value="S">S</option>
        </select>
        <span className="text-slate-500 font-mono">to</span>
        <select
          value={newTransNextState}
          onChange={(e) => setNewTransNextState(e.target.value)}
          className="table-cell-select"
        >
          {spec.states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <button onClick={handleAddTransition} className="btn-primary btn-sm flex items-center gap-1 ml-auto">
          <Plus size={14} />
          <span>Add Transition</span>
        </button>
      </div>

      {/* JSON Import/Export Modal */}
      {showJsonModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <span className="modal-title">Machine Specification JSON</span>
              <button onClick={() => setShowJsonModal(false)} className="btn-icon">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                className="w-full h-80 font-mono text-xs bg-slate-950 text-slate-200 p-3 rounded border border-slate-700 resize-none"
              />
              {importError && (
                <div className="mt-2 text-xs text-rose-400 font-medium">{importError}</div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowJsonModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleApplyImport} className="btn-primary">
                Apply & Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Diagnostics Modal */}
      {showValidationModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-xl">
            <div className="modal-header">
              <span className="modal-title">Specification Diagnostics</span>
              <button onClick={() => setShowValidationModal(false)} className="btn-icon">
                ✕
              </button>
            </div>
            <div className="modal-body space-y-3">
              {validationResult.valid && validationResult.warnings.length === 0 && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span>The machine specification conforms strictly to all schema and semantic rules!</span>
                </div>
              )}

              {validationResult.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-rose-400 mb-2">
                    Errors ({validationResult.errors.length}):
                  </h4>
                  <div className="space-y-1.5">
                    {validationResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded text-xs text-rose-200"
                      >
                        <span className="font-mono font-bold text-rose-300">[{err.code}]</span>{" "}
                        <span className="text-slate-400">({err.path}):</span> {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-amber-400 mb-2">
                    Warnings ({validationResult.warnings.length}):
                  </h4>
                  <div className="space-y-1.5">
                    {validationResult.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded text-xs text-amber-200"
                      >
                        <span className="font-mono font-bold text-amber-300">[{warn.code}]</span>{" "}
                        <span className="text-slate-400">({warn.path}):</span> {warn.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowValidationModal(false)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
