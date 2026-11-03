from typing import Optional, Any
from pydantic import BaseModel, Field
from .configuration import Configuration, SimulationStatus
from .transition import Transition


class TraceEntryView(BaseModel):
    step_number: int
    state_before: str
    state_after: str
    head_position_before: int
    head_position_after: int
    read_symbol: str
    write_symbol: str
    move: str
    transition_str: str
    outcome: Optional[SimulationStatus] = None


class TraceEntry:
    def __init__(
        self,
        step_number: int,
        state_before: str,
        state_after: str,
        head_position_before: int,
        head_position_after: int,
        read_symbol: str,
        write_symbol: str,
        move: str,
        transition: Optional[Transition],
        outcome: Optional[SimulationStatus],
        config_before: Configuration,
        config_after: Configuration,
    ):
        self.step_number = step_number
        self.state_before = state_before
        self.state_after = state_after
        self.head_position_before = head_position_before
        self.head_position_after = head_position_after
        self.read_symbol = read_symbol
        self.write_symbol = write_symbol
        self.move = move
        self.transition = transition
        self.outcome = outcome
        self.config_before = config_before
        self.config_after = config_after
        self.transition_str = transition.to_readable_string() if transition else "None"

    def to_view(self) -> TraceEntryView:
        return TraceEntryView(
            step_number=self.step_number,
            state_before=self.state_before,
            state_after=self.state_after,
            head_position_before=self.head_position_before,
            head_position_after=self.head_position_after,
            read_symbol=self.read_symbol,
            write_symbol=self.write_symbol,
            move=self.move,
            transition_str=self.transition_str,
            outcome=self.outcome,
        )


class ExecutionTrace:
    """Manages history of machine executions with undo and cycle detection."""

    def __init__(self):
        self.entries: list[TraceEntry] = []
        # Map signature -> step_number where it first occurred
        self._seen_signatures: dict[tuple, int] = {}
        self.detected_loop_step: Optional[int] = None

    def record_step(self, entry: TraceEntry) -> Optional[int]:
        """
        Record a step and check for repeating configurations.
        Returns the earlier step number if a loop was detected, else None.
        """
        self.entries.append(entry)
        sig = entry.config_after.signature()
        if sig in self._seen_signatures:
            earlier_step = self._seen_signatures[sig]
            if self.detected_loop_step is None:
                self.detected_loop_step = earlier_step
            return earlier_step
        else:
            self._seen_signatures[sig] = entry.step_number
            return None

    def pop_step(self) -> Optional[TraceEntry]:
        """Undo the last step. Returns popped entry or None if empty."""
        if not self.entries:
            return None
        popped = self.entries.pop()
        sig = popped.config_after.signature()
        if self._seen_signatures.get(sig) == popped.step_number:
            del self._seen_signatures[sig]
        if self.detected_loop_step == popped.step_number:
            self.detected_loop_step = None
        return popped

    def clear(self) -> None:
        self.entries.clear()
        self._seen_signatures.clear()
        self.detected_loop_step = None

    def get_views(self, start: int = 0, limit: Optional[int] = None) -> list[TraceEntryView]:
        selected = self.entries[start:]
        if limit is not None:
            selected = selected[:limit]
        return [e.to_view() for e in selected]

    def __len__(self) -> int:
        return len(self.entries)
