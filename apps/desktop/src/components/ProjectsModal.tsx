import React, { useState, useEffect } from "react";
import { FolderKanban, Save, Trash2, ArrowUpRight } from "lucide-react";
import type { ProjectRecord, TMSpecification } from "../types/tm";
import { listSavedProjects, saveProjectRecord, deleteProjectRecord } from "../services/api";

interface ProjectsModalProps {
  currentSpec: TMSpecification;
  currentInput: string;
  onLoadProject: (project: ProjectRecord) => void;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  currentSpec,
  currentInput,
  onLoadProject,
  onClose,
}) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [newProjectName, setNewProjectName] = useState<string>(currentSpec.name || "My Turing Machine");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const list = await listSavedProjects();
    setProjects(list);
  };

  const handleSaveCurrent = async () => {
    if (!newProjectName.trim()) return;
    setIsSaving(true);
    const newProj: ProjectRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: newProjectName.trim(),
      description: currentSpec.description,
      machine_spec: currentSpec,
      input_string: currentInput,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveProjectRecord(newProj);
    setIsSaving(false);
    await loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProjectRecord(id);
      await loadProjects();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-cyan-400" />
            <span className="modal-title">Project Storage</span>
          </div>
          <button onClick={onClose} className="btn-icon">
            ✕
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Save current project */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-slate-200 block">
              Save Current Machine
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                className="input-text text-xs flex-1"
              />
              <button
                onClick={handleSaveCurrent}
                disabled={isSaving}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* List saved projects */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saved Projects ({projects.length})
            </span>

            {projects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono italic">
                No saved projects yet. Save your current machine above!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{proj.name}</h4>
                      <p className="text-xs text-slate-400">
                        Input: <code className="text-cyan-400 font-mono font-bold">"{proj.input_string}"</code> • Transitions:{" "}
                        {proj.machine_spec?.transitions?.length || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onLoadProject(proj);
                          onClose();
                        }}
                        className="btn-secondary btn-sm flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowUpRight size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="btn-icon-danger"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
