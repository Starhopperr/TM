import httpx
from fastapi import APIRouter, HTTPException, Query
from ..schemas.contracts import (
    CompileRequest,
    CompileResponse,
    ValidateRequest,
    ValidateResponse,
    ExportRequest,
    ExportResponse,
)
from ...compiler.compiler_service import CompilerService
from ...validator.semantic_validator import validate_tm_specification

router = APIRouter(prefix="/api/tm", tags=["Turing Machine"])
compiler_service = CompilerService()


@router.get("/ollama/status")
async def check_ollama_status(base_url: str = Query("http://localhost:11434")):
    """Check if local Ollama daemon is reachable and list downloaded models."""
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                return {"connected": True, "base_url": base_url, "models": models}
            return {
                "connected": False,
                "base_url": base_url,
                "error": f"Ollama returned status {resp.status_code}",
                "models": [],
            }
    except Exception as e:
        return {
            "connected": False,
            "base_url": base_url,
            "error": f"Cannot reach Ollama at {base_url}. Is Ollama running? ({str(e)})",
            "models": [],
        }


@router.post("/compile", response_model=CompileResponse)
async def compile_machine(req: CompileRequest):
    """Compile a natural language description into formal Turing machine IR."""
    provider = compiler_service.get_provider(
        provider_name=req.provider,
        model=req.model,
        base_url=req.base_url,
        api_key=req.api_key,
    )
    res = await compiler_service.compile(
        prompt=req.prompt,
        clarification_answers=req.clarification_answers or "",
        provider=provider,
    )
    return CompileResponse(
        status=res.status,
        clarification_questions=res.clarification_questions,
        assumptions=res.assumptions,
        machine_spec=res.machine_spec,
        error_message=res.error_message,
    )


@router.post("/validate", response_model=ValidateResponse)
async def validate_machine(req: ValidateRequest):
    """Perform schema and semantic validation of a Turing machine specification."""
    res = validate_tm_specification(req.machine_spec)
    return ValidateResponse(
        valid=res.valid,
        errors=res.errors,
        warnings=res.warnings,
    )


@router.post("/export", response_model=ExportResponse)
async def export_machine(req: ExportRequest):
    """Export machine specification to JSON."""
    if req.format == "json":
        json_str = req.machine_spec.model_dump_json(indent=2)
        return ExportResponse(format="json", content=json_str)
    raise HTTPException(status_code=400, detail=f"Unsupported export format '{req.format}'")
