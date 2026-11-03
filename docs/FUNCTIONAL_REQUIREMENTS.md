# Functional and Non-Functional Requirements

## Functional requirements

### FR-01 — Natural-language input
The user can describe a TM in plain English.

### FR-02 — Ambiguity handling
The compiler must identify underspecified behavior and ask concise clarification questions. It must not silently invent transitions or acceptance semantics.

### FR-03 — Structured generation
The compiler outputs a machine-readable TM specification conforming to the canonical schema.

### FR-04 — Specification validation
The system validates syntax and semantics before simulation and provides actionable error messages.

### FR-05 — Editable specification
The user can edit states, alphabets, start state, halting states, and transitions.

### FR-06 — Input string
The user can enter a string over the machine's input alphabet. Invalid symbols are rejected before execution.

### FR-07 — Tape visualization
The UI renders tape cells, blank cells, head position, and current state.

### FR-08 — Step
Execute exactly one transition, unless the machine is already halted.

### FR-09 — Play / pause
Execute transitions repeatedly with a configurable delay. Pause must stop cleanly.

### FR-10 — Reset
Restore the initial configuration for the selected input.

### FR-11 — Trace
Show the sequence of configurations and applied transitions.

### FR-12 — Outcomes
Distinguish ACCEPT, REJECT, HALTED, and TIMEOUT. Do not conflate an undefined transition with an explicit reject state unless the machine semantics specify that.

### FR-13 — Step limit
Provide a configurable maximum step count to protect against non-halting machines.

### FR-14 — Save and load
Save projects locally and reopen them.

### FR-15 — Import/export
Support machine specification JSON import/export. Later support Markdown and diagram exports.

### FR-16 — Transition explanation
Display the transition applied in readable form, e.g. δ(q0, 1) = (q1, 0, R).

## Non-functional requirements

### NFR-01 — Determinism
Given the same specification and input, runtime execution must produce the same trace and outcome.

### NFR-02 — Responsiveness
Single-step operations should feel immediate. Animation must not block runtime logic.

### NFR-03 — Reliability
Malformed machine specifications must never crash the app or corrupt project data.

### NFR-04 — Safety
Never execute LLM-generated source code. Treat model output as untrusted data and validate it.

### NFR-05 — Local-first
Simulation and project editing should work without network access.

### NFR-06 — Accessibility
Keyboard-operable controls, readable contrast, labels, and reduced-motion option.

### NFR-07 — Extensibility
Use interfaces and types that can later support multiple machine variants without rewriting the DTM engine.

### NFR-08 — Privacy
Prompt and machine data should remain local unless a hosted LLM provider is explicitly selected. Explain provider data handling in settings.

## Error and edge cases
- Empty input string.
- Input contains a symbol outside the input alphabet.
- No transition defined for current state and symbol.
- Duplicate transitions for the same (state, read-symbol) pair.
- Start state missing or invalid.
- Accept/reject state references nonexistent.
- Machine accepts immediately or halts at initial configuration.
- Head moves left of initial position.
- Tape contains only blank symbols.
- Very long input.
- Non-halting loop.
- Step limit reached.
- LLM unavailable or returns malformed JSON.
- User cancels while compilation is in progress.
