# Turing Machine Intermediate Representation (IR)

## Purpose
This IR is the canonical contract between natural-language compilation, editing, validation, runtime, storage, and export. Do not couple it to a specific LLM provider or UI.

## Machine model
MVP uses a single-tape deterministic Turing machine.

A machine is represented conceptually as:
M = (Q, Σ, Γ, δ, q₀, q_accept, q_reject, blank)

Where:
- Q: finite set of states.
- Σ: input alphabet.
- Γ: tape alphabet, with Σ ⊆ Γ.
- δ: partial deterministic transition function.
- q₀: start state.
- q_accept: accepting halting state(s).
- q_reject: rejecting halting state(s).
- blank: blank tape symbol.

## JSON example

```json
{
  "schema_version": "1.0",
  "name": "Even Number of Ones",
  "description": "Accepts binary strings containing an even number of 1s.",
  "machine_type": "deterministic_single_tape",
  "states": ["q_even", "q_odd"],
  "input_alphabet": ["0", "1"],
  "tape_alphabet": ["0", "1", "_"],
  "blank_symbol": "_",
  "start_state": "q_even",
  "accept_states": ["q_accept"],
  "reject_states": ["q_reject"],
  "transitions": [
    {
      "state": "q_even",
      "read": "0",
      "write": "0",
      "move": "R",
      "next_state": "q_even"
    },
    {
      "state": "q_even",
      "read": "1",
      "write": "1",
      "move": "R",
      "next_state": "q_odd"
    },
    {
      "state": "q_odd",
      "read": "0",
      "write": "0",
      "move": "R",
      "next_state": "q_odd"
    },
    {
      "state": "q_odd",
      "read": "1",
      "write": "1",
      "move": "R",
      "next_state": "q_even"
    }
  ]
}
```

Important: the example above is a schema illustration. A correct implementation must define how end-of-input is detected and how a machine enters acceptance. Do not add transitions that read blank unless they are part of the intended machine. Prefer explicit transition definitions over implicit acceptance rules.

## Fields

| Field | Type | Required | Meaning |
|---|---|---|---|
| schema_version | string | yes | IR schema version |
| name | string | yes | Human-readable machine name |
| description | string | no | Intended language/behavior |
| machine_type | enum | yes | `deterministic_single_tape` for MVP |
| states | string[] | yes | All non-halting and halting states |
| input_alphabet | string[] | yes | Allowed input symbols |
| tape_alphabet | string[] | yes | Symbols allowed on tape |
| blank_symbol | string | yes | Exactly one blank symbol |
| start_state | string | yes | Initial state |
| accept_states | string[] | yes | Accepting halting states |
| reject_states | string[] | yes | Rejecting halting states |
| transitions | Transition[] | yes | Partial transition function |

## Transition object

```json
{
  "state": "q0",
  "read": "1",
  "write": "0",
  "move": "R",
  "next_state": "q1"
}
```

- `state`: state before transition.
- `read`: symbol currently under head.
- `write`: symbol replacing the read symbol.
- `move`: `L`, `R`, or `S`.
- `next_state`: state after transition.

## Semantics decisions to implement explicitly
- Accept/reject states are halting.
- Undefined transition behavior must be configurable or explicitly specified. Recommended default: halt with `HALTED_UNDEFINED_TRANSITION`, not silently label it REJECT.
- `S` means the head stays in the same cell.
- The tape is unbounded in both directions.
- Blank cells are implicit and may be omitted from sparse tape storage.
- The initial head position is index 0.
- Input symbols are placed starting at index 0.
- Empty input means the initial tape is blank.
- Step limit produces `TIMEOUT`, not acceptance or rejection.

## Validation rules
1. All state names are unique.
2. Every start/accept/reject/next state exists in `states`.
3. `input_alphabet` is a subset of `tape_alphabet`.
4. Blank symbol belongs to `tape_alphabet` and not to `input_alphabet`.
5. Every read/write symbol belongs to `tape_alphabet`.
6. For a deterministic machine, no two transitions share the same `(state, read)` key.
7. Accept and reject states are disjoint.
8. Halting states should not have outgoing transitions unless the chosen semantics explicitly permits them.
9. Every transition references a valid state.
10. Warn about unreachable states and unhandled state-symbol combinations; do not necessarily reject an intentionally partial transition function.

## Versioning
Add `schema_version`. Future versions should migrate old saved machine JSON instead of breaking existing projects.
