# Turing Studio — Builder Brief

## Product vision
Build a standalone desktop application that lets a user describe a Turing machine in natural language, converts the description into a formal machine specification, validates it, and simulates it with an animated, interactive tape.

The application is an educational computational-model simulator—not merely an LLM wrapper.

## Primary user journey
1. User enters a natural-language description of a machine.
2. The system detects ambiguity and asks clarifying questions when necessary.
3. The compiler generates a structured Turing Machine specification.
4. The validator checks the specification and reports errors or warnings.
5. The user reviews and optionally edits the transition table.
6. The user enters an input string and starts simulation.
7. The deterministic runtime executes transitions.
8. The UI visualizes the tape, read/write head, current state, transition, and trace.
9. The user can step, play, pause, reset, rewind, and export.

## Product principles
- Deterministic execution: the LLM never executes machine logic.
- Structured intermediate representation (IR): all frontends and LLM providers target one schema.
- Explainability: display the transition applied at every step.
- Local-first: simulation and saved projects work offline.
- Safe generation: never execute arbitrary code returned by a model.
- Extensibility: design interfaces so multi-tape and nondeterministic variants can be added later.

## MVP scope
- Single-tape deterministic Turing machines (DTM).
- English natural-language descriptions.
- Custom input and tape alphabets.
- Editable formal specification and transition table.
- Step-by-step and continuous simulation.
- Accept/reject/halt/timeout outcomes.
- Interactive tape visualization.
- Local save/load.
- JSON import/export.
- Offline simulation after the machine has been compiled.

## Out of scope for MVP
- Multi-tape Turing machines.
- Nondeterministic Turing machines.
- PDA, DFA, or other automata families.
- Cloud collaboration and user accounts.
- Arbitrary code generation or execution.
