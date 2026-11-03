from typing import Any, Union
from collections import defaultdict
from .schema_validator import ValidationIssue, ValidationResult, validate_schema
from ..engine.machine import TMSpecification


def validate_tm_specification(input_data: Union[dict[str, Any], TMSpecification]) -> ValidationResult:
    """
    Perform deep semantic validation of a Turing Machine specification.
    Returns ValidationResult with valid flag, list of errors, and list of warnings.
    """
    if isinstance(input_data, dict):
        schema_res = validate_schema(input_data)
        if not schema_res.valid or schema_res.parsed_spec is None:
            return schema_res
        spec = schema_res.parsed_spec
    else:
        spec = input_data

    errors: list[ValidationIssue] = []
    warnings: list[ValidationIssue] = []

    # 1. Check duplicate state names in declaration
    seen_states = set()
    for idx, st in enumerate(spec.states):
        if st in seen_states:
            errors.append(
                ValidationIssue(
                    code="DUPLICATE_STATE",
                    path=f"states[{idx}]",
                    message=f"Duplicate state name '{st}' in states list.",
                    severity="error",
                )
            )
        seen_states.add(st)

    state_set = set(spec.states)

    # 2. Start state exists in states
    if spec.start_state not in state_set:
        errors.append(
            ValidationIssue(
                code="UNKNOWN_START_STATE",
                path="start_state",
                message=f"Start state '{spec.start_state}' is not declared in states list.",
                severity="error",
            )
        )

    # 3. Accept states exist in states
    for idx, acc in enumerate(spec.accept_states):
        if acc not in state_set:
            errors.append(
                ValidationIssue(
                    code="UNKNOWN_ACCEPT_STATE",
                    path=f"accept_states[{idx}]",
                    message=f"Accept state '{acc}' is not declared in states list.",
                    severity="error",
                )
            )

    # 4. Reject states exist in states
    for idx, rej in enumerate(spec.reject_states):
        if rej not in state_set:
            errors.append(
                ValidationIssue(
                    code="UNKNOWN_REJECT_STATE",
                    path=f"reject_states[{idx}]",
                    message=f"Reject state '{rej}' is not declared in states list.",
                    severity="error",
                )
            )

    # 5. Accept and reject states must be disjoint
    overlap = set(spec.accept_states).intersection(set(spec.reject_states))
    if overlap:
        errors.append(
            ValidationIssue(
                code="OVERLAPPING_HALT_STATES",
                path="accept_states,reject_states",
                message=f"States {list(overlap)} are declared as both accept and reject states.",
                severity="error",
            )
        )

    # 6. Alphabets
    tape_alphabet_set = set(spec.tape_alphabet)
    input_alphabet_set = set(spec.input_alphabet)

    # Blank symbol in tape alphabet
    if spec.blank_symbol not in tape_alphabet_set:
        errors.append(
            ValidationIssue(
                code="BLANK_NOT_IN_TAPE_ALPHABET",
                path="blank_symbol",
                message=f"Blank symbol '{spec.blank_symbol}' is not included in tape_alphabet.",
                severity="error",
            )
        )

    # Blank symbol must NOT be in input alphabet
    if spec.blank_symbol in input_alphabet_set:
        errors.append(
            ValidationIssue(
                code="BLANK_IN_INPUT_ALPHABET",
                path="input_alphabet",
                message=f"Blank symbol '{spec.blank_symbol}' cannot be an input alphabet symbol.",
                severity="error",
            )
        )

    # Input alphabet must be a subset of tape alphabet
    extra_input_symbols = input_alphabet_set - tape_alphabet_set
    if extra_input_symbols:
        errors.append(
            ValidationIssue(
                code="INPUT_ALPHABET_NOT_SUBSET",
                path="input_alphabet",
                message=f"Input symbols {list(extra_input_symbols)} are not in tape_alphabet.",
                severity="error",
            )
        )

    # 7. Transition checks
    seen_transitions: dict[tuple[str, str], int] = {}
    halting_states = set(spec.accept_states).union(set(spec.reject_states))

    for idx, t in enumerate(spec.transitions):
        path_prefix = f"transitions[{idx}]"

        # Check source state
        if t.state not in state_set:
            errors.append(
                ValidationIssue(
                    code="UNKNOWN_STATE",
                    path=f"{path_prefix}.state",
                    message=f"Transition references undeclared source state '{t.state}'.",
                    severity="error",
                )
            )

        # Check next state
        if t.next_state not in state_set:
            errors.append(
                ValidationIssue(
                    code="UNKNOWN_STATE",
                    path=f"{path_prefix}.next_state",
                    message=f"Transition references undeclared target state '{t.next_state}'.",
                    severity="error",
                )
            )

        # Check read symbol
        if t.read not in tape_alphabet_set:
            errors.append(
                ValidationIssue(
                    code="INVALID_TAPE_SYMBOL",
                    path=f"{path_prefix}.read",
                    message=f"Read symbol '{t.read}' is not in tape_alphabet.",
                    severity="error",
                )
            )

        # Check write symbol
        if t.write not in tape_alphabet_set:
            errors.append(
                ValidationIssue(
                    code="INVALID_TAPE_SYMBOL",
                    path=f"{path_prefix}.write",
                    message=f"Write symbol '{t.write}' is not in tape_alphabet.",
                    severity="error",
                )
            )

        # Check determinism: duplicate (state, read)
        key = (t.state, t.read)
        if key in seen_transitions:
            first_idx = seen_transitions[key]
            errors.append(
                ValidationIssue(
                    code="DUPLICATE_TRANSITION",
                    path=path_prefix,
                    message=f"Non-deterministic or duplicate transition for ({t.state}, '{t.read}'). First defined at transitions[{first_idx}].",
                    severity="error",
                )
            )
        else:
            seen_transitions[key] = idx

        # Warning / error if outgoing transition from halting state
        if t.state in halting_states:
            warnings.append(
                ValidationIssue(
                    code="HALTING_STATE_HAS_TRANSITION",
                    path=f"{path_prefix}.state",
                    message=f"Halting state '{t.state}' has an outgoing transition. It will never be triggered during simulation.",
                    severity="warning",
                )
            )

    # 8. Reachability Analysis (Graph BFS)
    graph = defaultdict(set)
    for t in spec.transitions:
        graph[t.state].add(t.next_state)

    visited = set()
    queue = [spec.start_state] if spec.start_state in state_set else []
    while queue:
        st = queue.pop(0)
        if st not in visited:
            visited.add(st)
            for nxt in graph[st]:
                if nxt not in visited:
                    queue.append(nxt)

    unreachable = state_set - visited
    for unreach in sorted(unreachable):
        warnings.append(
            ValidationIssue(
                code="UNREACHABLE_STATE",
                path="states",
                message=f"State '{unreach}' is unreachable from start_state '{spec.start_state}'.",
                severity="warning",
            )
        )

    # 9. Transition Coverage Warning
    for st in spec.states:
        if st not in halting_states and st in visited:
            unhandled = [sym for sym in spec.tape_alphabet if (st, sym) not in seen_transitions]
            if unhandled:
                warnings.append(
                    ValidationIssue(
                        code="INCOMPLETE_TRANSITION_COVERAGE",
                        path=f"states.{st}",
                        message=f"State '{st}' has no transition for symbols: {unhandled}.",
                        severity="warning",
                    )
                )

    is_valid = len(errors) == 0
    return ValidationResult(
        valid=is_valid,
        errors=errors,
        warnings=warnings,
        parsed_spec=spec if is_valid else None,
    )
