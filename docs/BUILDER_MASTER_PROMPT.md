# Master Prompt for an AI App Builder

Build a standalone desktop application named **Turing Studio**.

## Goal
The application accepts natural-language descriptions of Turing machines, converts them into a validated formal specification, and visualizes deterministic execution on an interactive tape.

## Read these project documents first
- `README.md`
- `SYSTEM_ARCHITECTURE.md`
- `FUNCTIONAL_REQUIREMENTS.md`
- `TM_SPECIFICATION_SCHEMA.md`
- `COMPILER_AND_PROMPTS.md`
- `RUNTIME_AND_TAPE.md`
- `API_CONTRACTS.md`
- `UI_AND_VISUALIZATION.md`
- `PROJECT_STRUCTURE.md`
- `TESTING_STRATEGY.md`
- `ROADMAP.md`

## Non-negotiable architectural rules
1. Separate the natural-language compiler, validator, deterministic runtime, and visualization.
2. The LLM produces structured machine specifications only; never execute LLM-generated code.
3. Use the canonical TM IR from `TM_SPECIFICATION_SCHEMA.md`.
4. Runtime execution must be deterministic and independent of LLM availability.
5. Use a sparse tape representation with unbounded positive and negative indexes.
6. Undefined transitions must not silently be treated as rejection.
7. Validate all machine specs before simulation.
8. Provide a step limit.
9. Keep simulation and project editing local-first.
10. Build the MVP for single-tape deterministic Turing machines only.

## Preferred stack
- Tauri 2 desktop
- React + TypeScript
- Zustand
- SVG tape visualization
- Framer Motion
- Python + FastAPI local backend
- Pydantic
- SQLite
- Ollama adapter for local LLM; keep provider abstraction for hosted models

If the builder environment cannot support Tauri or Python, propose a viable implementation while preserving the architectural boundaries and deterministic runtime.

## UI requirements
Create a polished educational desktop interface with:
- Natural-language prompt editor.
- Compile button and loading/error states.
- Clarification dialogue.
- Editable machine specification and transition table.
- Tape visualization with cells and moving head.
- Current state, step number, read symbol, and last transition.
- Step, play, pause, run, reset, and undo controls.
- Speed control.
- Execution trace.
- Save/load and JSON import/export.
- Clear ACCEPT, REJECT, HALTED, and TIMEOUT statuses.
- Accessible keyboard interactions and reduced-motion option.

## Implementation process
1. Start by scaffolding the project and documenting setup.
2. Implement and test the core TM data model, tape, validator, and runtime.
3. Build the UI around the runtime's stable interface.
4. Add manual specification editing and JSON import/export.
5. Add natural-language compilation and clarification.
6. Add persistence and packaging.
7. Provide working tests and sample machines.

Do not only produce static mockups. Implement functioning interactions and a coherent end-to-end vertical slice. Keep files modular and provide clear setup/run instructions.
