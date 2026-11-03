from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
from .tape import SparseTape


class SimulationStatus(str, Enum):
    RUNNING = "RUNNING"
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"
    HALTED_UNDEFINED_TRANSITION = "HALTED_UNDEFINED_TRANSITION"
    TIMEOUT = "TIMEOUT"


class ConfigurationView(BaseModel):
    """Configuration format serialized for UI and API clients."""
    step_number: int
    current_state: str
    head_position: int
    status: SimulationStatus
    visible_tape: list[dict[str, Any]]
    non_blank_cells: dict[int, str]
    min_index: Optional[int] = None
    max_index: Optional[int] = None


class Configuration:
    """Internal runtime configuration of the Turing machine."""

    def __init__(
        self,
        step_number: int,
        current_state: str,
        head_position: int,
        tape: SparseTape,
        status: SimulationStatus = SimulationStatus.RUNNING,
    ):
        self.step_number = step_number
        self.current_state = current_state
        self.head_position = head_position
        self.tape = tape
        self.status = status

    def clone(self) -> "Configuration":
        return Configuration(
            step_number=self.step_number,
            current_state=self.current_state,
            head_position=self.head_position,
            tape=self.tape.clone(),
            status=self.status,
        )

    def to_view(self, window_radius: int = 15) -> ConfigurationView:
        nb_range = self.tape.non_blank_range()
        min_idx, max_idx = nb_range if nb_range else (None, None)
        return ConfigurationView(
            step_number=self.step_number,
            current_state=self.current_state,
            head_position=self.head_position,
            status=self.status,
            visible_tape=self.tape.get_window(center=self.head_position, radius=window_radius),
            non_blank_cells=self.tape.to_dict(),
            min_index=min_idx,
            max_index=max_idx,
        )

    def signature(self) -> tuple[str, int, tuple[tuple[int, str], ...]]:
        """Immutable signature for cycle / loop detection."""
        sorted_cells = tuple(sorted(self.tape.to_dict().items()))
        return (self.current_state, self.head_position, sorted_cells)
