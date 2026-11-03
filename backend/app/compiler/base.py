from abc import ABC, abstractmethod
from typing import Optional, Literal
from pydantic import BaseModel, Field
from ..engine.machine import TMSpecification

CompilerStatus = Literal["success", "needs_clarification", "error"]


class CompilerResponse(BaseModel):
    """Envelope for compiler responses according to API contracts."""
    status: CompilerStatus
    clarification_questions: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    machine_spec: Optional[TMSpecification] = None
    raw_output: Optional[str] = None
    error_message: Optional[str] = None


class LLMProvider(ABC):
    """Abstract interface for LLM backends."""

    @abstractmethod
    async def generate_response(self, prompt: str, system_prompt: str) -> str:
        """Query LLM and return raw text/JSON response."""
        pass
