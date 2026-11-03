# Testing Strategy

## 1. Unit tests: validator
Test:
- Duplicate state names.
- Unknown start state.
- Unknown next state.
- Invalid read/write symbol.
- Blank symbol included in input alphabet.
- Input alphabet not subset of tape alphabet.
- Duplicate `(state, read)` transitions.
- Accept/reject overlap.
- Outgoing transitions from halting states.
- Unreachable states as warnings.
- Incomplete transition coverage as warnings where appropriate.

## 2. Unit tests: tape
Test:
- Read blank from an unallocated cell.
- Write and overwrite symbols.
- Remove a cell from sparse storage when writing blank.
- Negative tape indexes.
- Arbitrarily large positive indexes.
- Input initialization.
- Empty input.

## 3. Unit tests: runtime
Test:
- Exactly one step.
- Left/right/stay movement.
- State update.
- Tape write.
- Accept state halting.
- Reject state halting.
- Undefined transition outcome.
- Step limit.
- Reset.
- Trace order.
- Deterministic repeated execution.
- Undo and replay.

## 4. Compiler tests
Use a mock LLM provider for deterministic tests.

Test prompts:
- Accept binary strings with an even number of ones.
- Recognize palindromes over `{0,1}`.
- Replace every `1` with `0`.
- Move to the right end of input and halt.
- Description with missing alphabet.
- Ambiguous accept/reject behavior.
- Invalid structured output.
- Provider timeout/unavailable.
- Prompt injection-like content treated as user task data, not compiler policy.

## 5. Integration tests
- Prompt → compiler → validator → review → runtime.
- Edit generated transition → validation → simulation.
- Save/load project.
- Export/import JSON.
- Run offline with a previously saved machine.
- LLM provider unavailable while runtime remains functional.

## 6. UI tests
- Tape cell renders correct symbol.
- Head points to correct index.
- Step updates tape/state/head.
- Play/pause behavior.
- Reset.
- Trace row selection.
- Keyboard controls.
- Reduced motion.

## 7. Example acceptance tests
### Even number of ones
Input `1010` should accept under a correct machine.
Input `111` should reject.
Input empty string should accept if the language includes epsilon.

### Binary incrementer
Input `101` should transform to `110` under the specified convention and halt.

### Unary incrementer
Input `111` should transform to `1111` and halt.

### Palindrome recognition
Test `101`, `1001`, `110`; confirm machine specification and trace match expected language.

Note: expected outputs must be derived from the formal machine and its explicit conventions, not guessed by the test harness.
