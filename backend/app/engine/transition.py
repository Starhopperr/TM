from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field

MoveDirection = Literal["L", "R", "S"]


class Transition(BaseModel):
    """Deterministic Turing machine transition: δ(state, read) = (next_state, write, move)."""
    state: str = Field(..., description="Current state before transition")
    read: str = Field(..., description="Symbol currently under the head")
    write: str = Field(..., description="Symbol to write to the tape cell")
    move: MoveDirection = Field(..., description="Head movement direction: L (Left), R (Right), S (Stay)")
    next_state: str = Field(..., description="Target state after transition")

    def __hash__(self) -> int:
        return hash((self.state, self.read, self.write, self.move, self.next_state))

    @property
    def key(self) -> tuple[str, str]:
        """Key used for deterministic transition table lookup: (state, read)."""
        return (self.state, self.read)

    def to_readable_string(self) -> str:
        """Formal representation: δ(state, read) -> (next_state, write, move)."""
        return f"δ({self.state}, '{self.read}') = ({self.next_state}, '{self.write}', {self.move})"
