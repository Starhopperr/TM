from typing import Optional, Literal, Any
from pydantic import BaseModel, Field
from ...engine.machine import TMSpecification
from ...engine.configuration import ConfigurationView, SimulationStatus
from ...engine.simulator import BreakpointConfig, StepResult, RunResult
from ...engine.trace import TraceEntryView
from ...validator.schema_validator import ValidationIssue


class CompileRequest(BaseModel):
    prompt: str
    provider: Literal["mock", "ollama", "hosted"] = "mock"
    model: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    clarification_answers: Optional[str] = ""


class CompileResponse(BaseModel):
    status: Literal["success", "needs_clarification", "error"]
    clarification_questions: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    machine_spec: Optional[TMSpecification] = None
    error_message: Optional[str] = None


class ValidateRequest(BaseModel):
    machine_spec: dict[str, Any]


class ValidateResponse(BaseModel):
    valid: bool
    errors: list[ValidationIssue] = Field(default_factory=list)
    warnings: list[ValidationIssue] = Field(default_factory=list)


class SimulationOptions(BaseModel):
    max_steps: int = Field(default=10000, ge=1, le=100000)
    undefined_transition: Literal["halt"] = "halt"


class CreateSimulationRequest(BaseModel):
    machine_spec: TMSpecification
    input_string: str = ""
    options: SimulationOptions = Field(default_factory=SimulationOptions)


class CreateSimulationResponse(BaseModel):
    simulation_id: str
    configuration: ConfigurationView
    status: SimulationStatus


class StepSimulationRequest(BaseModel):
    simulation_id: str


class RunSimulationRequest(BaseModel):
    simulation_id: str
    max_steps: Optional[int] = 10000
    breakpoints: Optional[BreakpointConfig] = None


class ResetSimulationRequest(BaseModel):
    simulation_id: str


class TraceResponse(BaseModel):
    simulation_id: str
    total_steps: int
    trace: list[TraceEntryView]


class ExportRequest(BaseModel):
    machine_spec: TMSpecification
    format: Literal["json"] = "json"


class ExportResponse(BaseModel):
    format: str
    content: str
