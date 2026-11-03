# Deterministic TM Runtime and Tape

## Runtime model

The runtime takes:
- A validated TM specification.
- An input string.
- Runtime options (step limit, undefined-transition behavior).

It emits:
- Initial configuration.
- Each subsequent configuration.
- Applied transition events.
- A final outcome.

## Configuration

```python
@dataclass
class Configuration:
    tape: dict[int, str]  # sparse map; missing key means blank
    head_position: int
    current_state: str
    step_number: int
```

A sparse dictionary supports an unbounded tape in both directions without allocating huge arrays. The runtime should expose a bounded visible window for rendering, but tape semantics remain unbounded.

## Transition representation

```python
@dataclass(frozen=True)
class Transition:
    state: str
    read_symbol: str
    write_symbol: str
    move: Literal["L", "R", "S"]
    next_state: str
```

Index transitions by `(state, read_symbol)` for efficient lookup.

## Step algorithm
1. Check whether current state is accepting or rejecting.
2. Read the symbol under the head; if absent in sparse tape, use blank.
3. Look up transition `(current_state, symbol)`.
4. If missing, halt according to configured undefined-transition semantics.
5. Write the specified symbol.
6. Move head left, right, or stay.
7. Change state.
8. Increment step counter.
9. Emit the new configuration and transition event.
10. Check halting state and step limit.

## Suggested outcomes
- `ACCEPT`
- `REJECT`
- `HALTED_UNDEFINED_TRANSITION`
- `TIMEOUT`
- `RUNNING`

## API shape

```python
class TuringMachineRuntime:
    def initialize(self, machine_spec, input_string) -> Configuration:
        ...

    def step(self, config) -> StepResult:
        ...

    def run(self, config, max_steps) -> RunResult:
        ...

    def reset(self) -> Configuration:
        ...

    def get_trace(self) -> list[Configuration]:
        ...
```

## Trace and undo
Store an immutable snapshot or reversible delta per step.

A trace entry should include:
- Step number.
- State before and after.
- Head position before and after.
- Read symbol.
- Write symbol.
- Movement.
- Transition identifier.
- Outcome, if halted.

For memory efficiency, consider storing tape deltas (cell changed, previous symbol) and periodic snapshots. MVP may store complete snapshots for small traces, but design the interface to permit delta-based history.

## Loop detection
Optional MVP warning:
- Hash configuration (state, head position, nonblank tape contents).
- If a configuration repeats, notify the user that a loop may be occurring.
- Do not declare nontermination solely because a configuration repeats unless the complete configuration is identical and deterministic semantics apply.
- Keep the step limit as the definitive safety bound.

## Input initialization
- Place input characters starting at tape index 0.
- Initial head position is 0.
- Initial state is `start_state`.
- Empty input creates an all-blank tape.
- Validate each input symbol against `input_alphabet` before runtime begins.

## Undefined transitions
Do not assume undefined transition equals REJECT. Recommended default outcome: `HALTED_UNDEFINED_TRANSITION`, with an optional machine-level semantics setting if needed.

## Left boundary
There is no left boundary. The tape extends infinitely in both directions. Moving left from index 0 moves to index -1.
