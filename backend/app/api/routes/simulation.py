import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from ..schemas.contracts import (
    CreateSimulationRequest,
    CreateSimulationResponse,
    StepSimulationRequest,
    RunSimulationRequest,
    ResetSimulationRequest,
    TraceResponse,
)
from ...engine.simulator import TuringMachineRuntime, StepResult, RunResult
from ...validator.semantic_validator import validate_tm_specification

router = APIRouter(prefix="/api/tm/simulation", tags=["Simulation"])

# Active in-memory simulation sessions
_active_simulations: dict[str, TuringMachineRuntime] = {}


@router.post("/create", response_model=CreateSimulationResponse)
async def create_simulation(req: CreateSimulationRequest):
    """Validate machine and instantiate a new deterministic simulation session."""
    val_res = validate_tm_specification(req.machine_spec)
    if not val_res.valid:
        error_msgs = "; ".join(e.message for e in val_res.errors)
        raise HTTPException(
            status_code=400,
            detail=f"Machine specification failed validation: {error_msgs}"
        )

    # Validate input symbols against input_alphabet
    allowed_inputs = set(req.machine_spec.input_alphabet)
    for idx, char in enumerate(req.input_string):
        if char not in allowed_inputs:
            raise HTTPException(
                status_code=400,
                detail=f"Input string contains symbol '{char}' at index {idx} which is not in input_alphabet {req.machine_spec.input_alphabet}"
            )

    runtime = TuringMachineRuntime(
        spec=req.machine_spec,
        default_max_steps=req.options.max_steps,
    )
    initial_config = runtime.initialize(req.input_string)
    sim_id = str(uuid.uuid4())
    _active_simulations[sim_id] = runtime

    return CreateSimulationResponse(
        simulation_id=sim_id,
        configuration=initial_config,
        status=runtime.current_config.status,
    )


@router.post("/step", response_model=StepResult)
async def step_simulation(req: StepSimulationRequest):
    """Execute a single atomic step."""
    runtime = _active_simulations.get(req.simulation_id)
    if not runtime:
        raise HTTPException(status_code=404, detail="Simulation session not found.")
    return runtime.step()


@router.post("/step_back", response_model=StepResult)
async def step_back_simulation(req: StepSimulationRequest):
    """Undo the last step and restore the previous configuration."""
    runtime = _active_simulations.get(req.simulation_id)
    if not runtime:
        raise HTTPException(status_code=404, detail="Simulation session not found.")
    return runtime.step_back()


@router.post("/run", response_model=RunResult)
async def run_simulation(req: RunSimulationRequest):
    """Continuously execute transitions until halt, breakpoint, or step limit."""
    runtime = _active_simulations.get(req.simulation_id)
    if not runtime:
        raise HTTPException(status_code=404, detail="Simulation session not found.")
    return runtime.run(
        max_steps=req.max_steps,
        breakpoints=req.breakpoints,
    )


@router.post("/reset", response_model=CreateSimulationResponse)
async def reset_simulation(req: ResetSimulationRequest):
    """Reset simulation back to step 0 with the initial tape and state."""
    runtime = _active_simulations.get(req.simulation_id)
    if not runtime:
        raise HTTPException(status_code=404, detail="Simulation session not found.")
    config = runtime.reset()
    return CreateSimulationResponse(
        simulation_id=req.simulation_id,
        configuration=config,
        status=runtime.current_config.status,
    )


@router.get("/trace", response_model=TraceResponse)
async def get_simulation_trace(
    simulation_id: str,
    start_step: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=1000),
):
    """Retrieve historical trace entries for playback or inspection."""
    runtime = _active_simulations.get(simulation_id)
    if not runtime:
        raise HTTPException(status_code=404, detail="Simulation session not found.")
    trace_views = runtime.trace.get_views(start=start_step, limit=limit)
    return TraceResponse(
        simulation_id=simulation_id,
        total_steps=len(runtime.trace),
        trace=trace_views,
    )
