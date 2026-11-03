from typing import Literal, Optional
from pydantic import BaseModel, Field
from .transition import Transition

MachineType = Literal["deterministic_single_tape"]


class TMSpecification(BaseModel):
    """Canonical Intermediate Representation (IR) for a Turing Machine."""
    schema_version: str = Field(default="1.0", description="IR schema version")
    name: str = Field(..., description="Human-readable machine name")
    description: Optional[str] = Field(default=None, description="Detailed explanation of machine behavior")
    machine_type: MachineType = Field(
        default="deterministic_single_tape",
        description="Machine architecture type"
    )
    states: list[str] = Field(..., description="Complete set of all states Q")
    input_alphabet: list[str] = Field(..., description="Input alphabet Σ")
    tape_alphabet: list[str] = Field(..., description="Tape alphabet Γ (must contain Σ and blank_symbol)")
    blank_symbol: str = Field(default="_", description="Designated blank symbol on the tape")
    start_state: str = Field(..., description="Initial state q0")
    accept_states: list[str] = Field(default_factory=list, description="Accepting halting states F_accept")
    reject_states: list[str] = Field(default_factory=list, description="Rejecting halting states F_reject")
    transitions: list[Transition] = Field(..., description="Transition function δ")

    def build_transition_map(self) -> dict[tuple[str, str], Transition]:
        """Index transitions by (state, read) for O(1) lookup."""
        lookup: dict[tuple[str, str], Transition] = {}
        for t in self.transitions:
            lookup[(t.state, t.read)] = t
        return lookup

    def is_accept_state(self, state: str) -> bool:
        return state in self.accept_states

    def is_reject_state(self, state: str) -> bool:
        return state in self.reject_states

    def is_halting_state(self, state: str) -> bool:
        return self.is_accept_state(state) or self.is_reject_state(state)
