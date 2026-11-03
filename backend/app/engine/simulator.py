from typing import Optional, Set
from pydantic import BaseModel, Field
from .machine import TMSpecification
from .tape import SparseTape
from .configuration import Configuration, ConfigurationView, SimulationStatus
from .transition import Transition
from .trace import ExecutionTrace, TraceEntry, TraceEntryView


class BreakpointConfig(BaseModel):
    states: list[str] = Field(default_factory=list, description="Halt when reaching any of these states")
    transitions: list[tuple[str, str]] = Field(
        default_factory=list,
        description="Halt before executing transition (state, read)"
    )
    step_numbers: list[int] = Field(default_factory=list, description="Halt at specific step numbers")


class StepResult(BaseModel):
    step_number: int
    configuration: ConfigurationView
    transition_applied: Optional[dict] = None
    status: SimulationStatus
    loop_detected: Optional[int] = None
    hit_breakpoint: bool = False


class RunResult(BaseModel):
    steps_executed: int
    final_configuration: ConfigurationView
    status: SimulationStatus
    hit_breakpoint: bool = False
    loop_detected: Optional[int] = None


class TuringMachineRuntime:
    """
    Deterministic Turing Machine Runtime.
    Independent of LLM availability, executes DTM specifications with unbounded sparse tape.
    """

    def __init__(self, spec: TMSpecification, default_max_steps: int = 10000):
        self.spec = spec
        self.default_max_steps = default_max_steps
        self.transition_map: dict[tuple[str, str], Transition] = spec.build_transition_map()
        self.trace = ExecutionTrace()
        self.input_string: str = ""
        self.current_config: Configuration = self._create_initial_config("")

    def _create_initial_config(self, input_string: str) -> Configuration:
        tape = SparseTape.from_input(input_string, blank_symbol=self.spec.blank_symbol)
        initial_state = self.spec.start_state
        initial_status = SimulationStatus.RUNNING
        # Check if start state is immediately halting
        if self.spec.is_accept_state(initial_state):
            initial_status = SimulationStatus.ACCEPT
        elif self.spec.is_reject_state(initial_state):
            initial_status = SimulationStatus.REJECT

        return Configuration(
            step_number=0,
            current_state=initial_state,
            head_position=0,
            tape=tape,
            status=initial_status,
        )

    def initialize(self, input_string: str) -> ConfigurationView:
        """Initialize or reset machine with the given input string."""
        self.input_string = input_string
        self.trace.clear()
        self.current_config = self._create_initial_config(input_string)
        return self.current_config.to_view()

    def reset(self) -> ConfigurationView:
        """Reset to initial input configuration."""
        return self.initialize(self.input_string)

    def is_halted(self) -> bool:
        return self.current_config.status in (
            SimulationStatus.ACCEPT,
            SimulationStatus.REJECT,
            SimulationStatus.HALTED_UNDEFINED_TRANSITION,
            SimulationStatus.TIMEOUT,
        )

    def step(self) -> StepResult:
        """Execute exactly one transition step."""
        if self.is_halted():
            return StepResult(
                step_number=self.current_config.step_number,
                configuration=self.current_config.to_view(),
                transition_applied=None,
                status=self.current_config.status,
                loop_detected=self.trace.detected_loop_step,
                hit_breakpoint=False,
            )

        config_before = self.current_config.clone()
        curr_state = self.current_config.current_state
        curr_head = self.current_config.head_position
        read_symbol = self.current_config.tape.read(curr_head)

        # Lookup transition
        key = (curr_state, read_symbol)
        transition = self.transition_map.get(key)

        if transition is None:
            # Undefined transition halts machine
            self.current_config.status = SimulationStatus.HALTED_UNDEFINED_TRANSITION
            entry = TraceEntry(
                step_number=self.current_config.step_number + 1,
                state_before=curr_state,
                state_after=curr_state,
                head_position_before=curr_head,
                head_position_after=curr_head,
                read_symbol=read_symbol,
                write_symbol=read_symbol,
                move="S",
                transition=None,
                outcome=SimulationStatus.HALTED_UNDEFINED_TRANSITION,
                config_before=config_before,
                config_after=self.current_config.clone(),
            )
            self.trace.record_step(entry)
            return StepResult(
                step_number=self.current_config.step_number,
                configuration=self.current_config.to_view(),
                transition_applied=None,
                status=self.current_config.status,
                loop_detected=None,
                hit_breakpoint=False,
            )

        # Apply transition
        new_tape = self.current_config.tape.clone()
        new_tape.write(curr_head, transition.write)

        # Move head
        if transition.move == "L":
            new_head = curr_head - 1
        elif transition.move == "R":
            new_head = curr_head + 1
        else:  # "S"
            new_head = curr_head

        new_state = transition.next_state
        new_step_num = self.current_config.step_number + 1

        # Determine outcome
        new_status = SimulationStatus.RUNNING
        if self.spec.is_accept_state(new_state):
            new_status = SimulationStatus.ACCEPT
        elif self.spec.is_reject_state(new_state):
            new_status = SimulationStatus.REJECT
        elif new_step_num >= self.default_max_steps:
            new_status = SimulationStatus.TIMEOUT

        self.current_config = Configuration(
            step_number=new_step_num,
            current_state=new_state,
            head_position=new_head,
            tape=new_tape,
            status=new_status,
        )

        entry = TraceEntry(
            step_number=new_step_num,
            state_before=curr_state,
            state_after=new_state,
            head_position_before=curr_head,
            head_position_after=new_head,
            read_symbol=read_symbol,
            write_symbol=transition.write,
            move=transition.move,
            transition=transition,
            outcome=new_status if new_status != SimulationStatus.RUNNING else None,
            config_before=config_before,
            config_after=self.current_config.clone(),
        )
        loop_step = self.trace.record_step(entry)

        return StepResult(
            step_number=new_step_num,
            configuration=self.current_config.to_view(),
            transition_applied=transition.model_dump(),
            status=new_status,
            loop_detected=loop_step,
            hit_breakpoint=False,
        )

    def step_back(self) -> StepResult:
        """Undo the last step and return to the previous configuration."""
        popped = self.trace.pop_step()
        if popped is None:
            # Already at initial configuration
            return StepResult(
                step_number=self.current_config.step_number,
                configuration=self.current_config.to_view(),
                transition_applied=None,
                status=self.current_config.status,
                loop_detected=None,
                hit_breakpoint=False,
            )

        self.current_config = popped.config_before.clone()
        return StepResult(
            step_number=self.current_config.step_number,
            configuration=self.current_config.to_view(),
            transition_applied=None,
            status=self.current_config.status,
            loop_detected=self.trace.detected_loop_step,
            hit_breakpoint=False,
        )

    def run(
        self,
        max_steps: Optional[int] = None,
        breakpoints: Optional[BreakpointConfig] = None,
    ) -> RunResult:
        """Run execution until a halting state, breakpoint, or step limit is encountered."""
        limit = max_steps or self.default_max_steps
        executed_in_this_run = 0
        bp = breakpoints or BreakpointConfig()
        hit_bp = False
        loop_step = None

        while not self.is_halted() and executed_in_this_run < limit:
            # Check pre-transition breakpoints
            curr_read = self.current_config.tape.read(self.current_config.head_position)
            curr_state = self.current_config.current_state

            if (curr_state, curr_read) in bp.transitions and executed_in_this_run > 0:
                hit_bp = True
                break

            step_res = self.step()
            executed_in_this_run += 1
            if step_res.loop_detected:
                loop_step = step_res.loop_detected

            # Check post-transition state or step breakpoints
            if self.current_config.current_state in bp.states:
                hit_bp = True
                break
            if self.current_config.step_number in bp.step_numbers:
                hit_bp = True
                break

        # Check if step limit reached
        if not self.is_halted() and executed_in_this_run >= limit and not hit_bp:
            self.current_config.status = SimulationStatus.TIMEOUT

        return RunResult(
            steps_executed=executed_in_this_run,
            final_configuration=self.current_config.to_view(),
            status=self.current_config.status,
            hit_breakpoint=hit_bp,
            loop_detected=loop_step,
        )
