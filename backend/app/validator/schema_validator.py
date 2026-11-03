from typing import Any, Optional, Literal
from pydantic import BaseModel, Field, ValidationError
from ..engine.machine import TMSpecification


class ValidationIssue(BaseModel):
    code: str
    path: str
    message: str
    severity: Literal["error", "warning"] = "error"


class ValidationResult(BaseModel):
    valid: bool
    errors: list[ValidationIssue] = Field(default_factory=list)
    warnings: list[ValidationIssue] = Field(default_factory=list)
    parsed_spec: Optional[TMSpecification] = None


def validate_schema(data: dict[str, Any]) -> ValidationResult:
    """Validate JSON payload against TMSpecification schema using Pydantic."""
    try:
        spec = TMSpecification.model_validate(data)
        return ValidationResult(valid=True, errors=[], warnings=[], parsed_spec=spec)
    except ValidationError as e:
        issues: list[ValidationIssue] = []
        for err in e.errors():
            loc_str = ".".join(str(part) for part in err["loc"])
            issues.append(
                ValidationIssue(
                    code="SCHEMA_VALIDATION_ERROR",
                    path=loc_str,
                    message=err["msg"],
                    severity="error",
                )
            )
        return ValidationResult(valid=False, errors=issues, warnings=[], parsed_spec=None)
