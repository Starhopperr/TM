# UI and Visualization Specification

## Main screen layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ Turing Studio       Project       Save      Settings             │
├────────────────────────────────────────────────────────────────────┤
│ Natural-language machine description                              │
│ [ Describe the machine...                              ] [Compile]│
├──────────────────────────────┬─────────────────────────────────────┤
│ Formal machine             │ Current runtime                     │
│ States / alphabet          │ State: q0     Steps: 0               │
│ Editable transition table  │ Outcome: RUNNING                    │
├──────────────────────────────┴─────────────────────────────────────┤
│                         TAPE                                  │
│ ... | _ | 1 | 0 | 1 | _ | _ | _ | ...                         │
│                 ↑ Head                                          │
├────────────────────────────────────────────────────────────────┤
│ [Reset] [Step Back] [Step] [Play] [Pause] [Run] [Speed]         │
├────────────────────────────────────────────────────────────────┤
│ Transition: δ(q0, 1) = (q1, 0, R)                              │
│ Execution trace / warnings / breakpoints                        │
└────────────────────────────────────────────────────────────────┘
```

## Core components
- `PromptEditor`
- `ClarificationDialog`
- `MachineSpecEditor`
- `TransitionTable`
- `TapeViewport`
- `TapeCell`
- `HeadMarker`
- `StateBadge`
- `TransitionExplanation`
- `PlaybackToolbar`
- `TracePanel`
- `BreakpointManager`
- `ProjectBrowser`
- `SettingsPanel`

## Tape rendering
Use SVG for the tape.

Each cell:
- Has a stable tape index.
- Shows a symbol, or blank marker.
- Can be selected for inspection.
- Highlights the current head position.
- Supports zoom and horizontal scrolling.
- Allows a visible window around the head and nonblank cells.
- Does not allocate/render the entire infinite tape.

Head:
- Display a clear arrow or marker.
- Animate movement from old index to new index.
- Respect reduced-motion setting.
- Keep head visible during execution.

## Controls
- Step: exactly one transition.
- Play: run repeatedly.
- Pause: stop after current atomic transition.
- Run: execute until halt, breakpoint, or step limit.
- Reset: restore initial tape and state.
- Back: restore previous configuration.
- Speed: configurable delay, e.g. slow/normal/fast.
- Breakpoint: pause before or after selected state/transition according to clearly defined semantics.

## State display
Always show:
- Current state.
- Step number.
- Head index.
- Current read symbol.
- Last transition.
- Runtime status.

## Trace panel
Display each step in a compact row:
`#12 | q0 reads 1 | writes 0 | moves R | q1`

Selecting a trace row should display its configuration and move the visualization to that historical state.

## UX states
- Empty project.
- Prompt entered.
- Compiling.
- Clarification needed.
- Compilation error.
- Specification generated.
- Validation failed.
- Ready to simulate.
- Running.
- Paused.
- Accepted.
- Rejected.
- Undefined-transition halt.
- Timeout.
- LLM offline/unavailable.

## Accessibility
- Keyboard controls for playback.
- Focus management.
- Screen-reader labels for tape cells and states.
- High-contrast state and head markers.
- Reduced-motion option.
- Do not rely on color alone to distinguish state.
