# Development Roadmap

## Milestone 1 — Core runtime
Deliver:
- TM data models.
- Sparse infinite tape.
- Deterministic transition lookup.
- Step, run, reset.
- Halting outcomes and step limit.
- Unit tests.

Exit criteria:
- Runtime can simulate a manually defined machine without any UI or LLM.

## Milestone 2 — Interactive tape UI
Deliver:
- React desktop shell.
- SVG tape cells and head.
- State/step panel.
- Step/play/pause/reset.
- Runtime trace.
- Responsive layout and keyboard controls.

Exit criteria:
- User can load a hardcoded machine and interactively simulate it.

## Milestone 3 — Machine editor and validator
Deliver:
- JSON machine editor.
- Transition table editor.
- Schema validation.
- Semantic validation.
- Error and warning display.
- Import/export JSON.

Exit criteria:
- User can create, edit, validate, and simulate a machine manually.

## Milestone 4 — Natural-language compiler
Deliver:
- Provider interface.
- Ollama adapter and/or hosted API adapter.
- Structured output.
- Clarification dialogue.
- Validation/repair loop.
- Prompt and assumption review.

Exit criteria:
- A natural-language prompt yields a valid, editable machine spec for supported tasks.

## Milestone 5 — Persistence and polish
Deliver:
- SQLite project storage.
- Save/load.
- Trace history.
- Undo/replay.
- Breakpoints.
- Animation speed and reduced-motion setting.
- Packaging for target OS.

Exit criteria:
- A standalone user can install, create, save, reopen, and simulate projects.

## Milestone 6 — Advanced research/education features
Potential:
- State transition graph.
- AI explanation of transitions.
- Test-string generation.
- Loop detection.
- Multi-tape TM.
- Nondeterministic TM.
- Other automata families.

## Recommended build order
Do not start with the LLM. First prove the formal runtime and tape UI. Then add compilation once the canonical IR and validator are stable.
