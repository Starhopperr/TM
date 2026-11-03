import pytest
from app.engine.machine import TMSpecification
from app.engine.simulator import TuringMachineRuntime, SimulationStatus, BreakpointConfig
from app.validator.semantic_validator import validate_tm_specification


def even_ones_spec() -> TMSpecification:
    data = {
        "schema_version": "1.0",
        "name": "Even Number of Ones",
        "machine_type": "deterministic_single_tape",
        "states": ["q_even", "q_odd", "q_accept", "q_reject"],
        "input_alphabet": ["0", "1"],
        "tape_alphabet": ["0", "1", "_"],
        "blank_symbol": "_",
        "start_state": "q_even",
        "accept_states": ["q_accept"],
        "reject_states": ["q_reject"],
        "transitions": [
            {"state": "q_even", "read": "0", "write": "0", "move": "R", "next_state": "q_even"},
            {"state": "q_even", "read": "1", "write": "1", "move": "R", "next_state": "q_odd"},
            {"state": "q_even", "read": "_", "write": "_", "move": "S", "next_state": "q_accept"},
            {"state": "q_odd", "read": "0", "write": "0", "move": "R", "next_state": "q_odd"},
            {"state": "q_odd", "read": "1", "write": "1", "move": "R", "next_state": "q_even"},
            {"state": "q_odd", "read": "_", "write": "_", "move": "S", "next_state": "q_reject"},
        ],
    }
    return TMSpecification.model_validate(data)


def binary_incrementer_spec() -> TMSpecification:
    """
    Increments a binary number by 1.
    Starts at leftmost bit, moves right to end of input (blank), then moves left carrying 1.
    If carries off left edge, writes 1 and halts.
    """
    data = {
        "schema_version": "1.0",
        "name": "Binary Incrementer",
        "machine_type": "deterministic_single_tape",
        "states": ["q_scan_right", "q_carry", "q_halt"],
        "input_alphabet": ["0", "1"],
        "tape_alphabet": ["0", "1", "_"],
        "blank_symbol": "_",
        "start_state": "q_scan_right",
        "accept_states": ["q_halt"],
        "reject_states": [],
        "transitions": [
            # Scan right to the end
            {"state": "q_scan_right", "read": "0", "write": "0", "move": "R", "next_state": "q_scan_right"},
            {"state": "q_scan_right", "read": "1", "write": "1", "move": "R", "next_state": "q_scan_right"},
            {"state": "q_scan_right", "read": "_", "write": "_", "move": "L", "next_state": "q_carry"},
            # Carry bit additions from right to left
            {"state": "q_carry", "read": "0", "write": "1", "move": "S", "next_state": "q_halt"},
            {"state": "q_carry", "read": "1", "write": "0", "move": "L", "next_state": "q_carry"},
            {"state": "q_carry", "read": "_", "write": "1", "move": "S", "next_state": "q_halt"},
        ],
    }
    return TMSpecification.model_validate(data)


def unary_incrementer_spec() -> TMSpecification:
    """Appends '1' to a unary sequence of 1s."""
    data = {
        "schema_version": "1.0",
        "name": "Unary Incrementer",
        "machine_type": "deterministic_single_tape",
        "states": ["q_seek", "q_halt"],
        "input_alphabet": ["1"],
        "tape_alphabet": ["1", "_"],
        "blank_symbol": "_",
        "start_state": "q_seek",
        "accept_states": ["q_halt"],
        "reject_states": [],
        "transitions": [
            {"state": "q_seek", "read": "1", "write": "1", "move": "R", "next_state": "q_seek"},
            {"state": "q_seek", "read": "_", "write": "1", "move": "S", "next_state": "q_halt"},
        ],
    }
    return TMSpecification.model_validate(data)


def palindrome_spec() -> TMSpecification:
    """Recognizes binary palindromes over {0,1}."""
    data = {
        "schema_version": "1.0",
        "name": "Binary Palindrome Recognizer",
        "machine_type": "deterministic_single_tape",
        "states": [
            "q_start",
            "q_match_0",
            "q_match_1",
            "q_rewind",
            "q_accept",
            "q_reject",
        ],
        "input_alphabet": ["0", "1"],
        "tape_alphabet": ["0", "1", "_"],
        "blank_symbol": "_",
        "start_state": "q_start",
        "accept_states": ["q_accept"],
        "reject_states": ["q_reject"],
        "transitions": [
            # q_start: read leftmost symbol, blank it, remember it
            {"state": "q_start", "read": "0", "write": "_", "move": "R", "next_state": "q_match_0"},
            {"state": "q_start", "read": "1", "write": "_", "move": "R", "next_state": "q_match_1"},
            {"state": "q_start", "read": "_", "write": "_", "move": "S", "next_state": "q_accept"},
            # match_0: move right to blank, check rightmost symbol is 0
            {"state": "q_match_0", "read": "0", "write": "0", "move": "R", "next_state": "q_match_0"},
            {"state": "q_match_0", "read": "1", "write": "1", "move": "R", "next_state": "q_match_0"},
            {"state": "q_match_0", "read": "_", "write": "_", "move": "L", "next_state": "q_check_0"},
            # Helper states for checking matching boundary
        ],
    }
    # To keep simple, let's build the full standard palindrome transitions cleanly:
    full_palindrome_data = {
        "schema_version": "1.0",
        "name": "Binary Palindrome Recognizer",
        "machine_type": "deterministic_single_tape",
        "states": [
            "q0",
            "q_saw0",
            "q_saw1",
            "q_check0",
            "q_check1",
            "q_back",
            "q_accept",
            "q_reject",
        ],
        "input_alphabet": ["0", "1"],
        "tape_alphabet": ["0", "1", "_"],
        "blank_symbol": "_",
        "start_state": "q0",
        "accept_states": ["q_accept"],
        "reject_states": ["q_reject"],
        "transitions": [
            {"state": "q0", "read": "0", "write": "_", "move": "R", "next_state": "q_saw0"},
            {"state": "q0", "read": "1", "write": "_", "move": "R", "next_state": "q_saw1"},
            {"state": "q0", "read": "_", "write": "_", "move": "S", "next_state": "q_accept"},

            {"state": "q_saw0", "read": "0", "write": "0", "move": "R", "next_state": "q_saw0"},
            {"state": "q_saw0", "read": "1", "write": "1", "move": "R", "next_state": "q_saw0"},
            {"state": "q_saw0", "read": "_", "write": "_", "move": "L", "next_state": "q_check0"},

            {"state": "q_check0", "read": "0", "write": "_", "move": "L", "next_state": "q_back"},
            {"state": "q_check0", "read": "_", "write": "_", "move": "S", "next_state": "q_accept"},
            {"state": "q_check0", "read": "1", "write": "1", "move": "S", "next_state": "q_reject"},

            {"state": "q_saw1", "read": "0", "write": "0", "move": "R", "next_state": "q_saw1"},
            {"state": "q_saw1", "read": "1", "write": "1", "move": "R", "next_state": "q_saw1"},
            {"state": "q_saw1", "read": "_", "write": "_", "move": "L", "next_state": "q_check1"},

            {"state": "q_check1", "read": "1", "write": "_", "move": "L", "next_state": "q_back"},
            {"state": "q_check1", "read": "_", "write": "_", "move": "S", "next_state": "q_accept"},
            {"state": "q_check1", "read": "0", "write": "0", "move": "S", "next_state": "q_reject"},

            {"state": "q_back", "read": "0", "write": "0", "move": "L", "next_state": "q_back"},
            {"state": "q_back", "read": "1", "write": "1", "move": "L", "next_state": "q_back"},
            {"state": "q_back", "read": "_", "write": "_", "move": "R", "next_state": "q0"},
        ],
    }
    return TMSpecification.model_validate(full_palindrome_data)


def test_even_ones_acceptance():
    runtime = TuringMachineRuntime(even_ones_spec())
    # 1010 -> 2 ones -> ACCEPT
    runtime.initialize("1010")
    res = runtime.run()
    assert res.status == SimulationStatus.ACCEPT

    # 111 -> 3 ones -> REJECT
    runtime.initialize("111")
    res = runtime.run()
    assert res.status == SimulationStatus.REJECT

    # empty string -> 0 ones (even) -> ACCEPT
    runtime.initialize("")
    res = runtime.run()
    assert res.status == SimulationStatus.ACCEPT


def test_binary_incrementer():
    runtime = TuringMachineRuntime(binary_incrementer_spec())
    # 101 -> 110
    runtime.initialize("101")
    res = runtime.run()
    assert res.status == SimulationStatus.ACCEPT
    tape = runtime.current_config.tape
    # indices 0,1,2 should be 1, 1, 0
    assert tape.read(0) == "1"
    assert tape.read(1) == "1"
    assert tape.read(2) == "0"


def test_unary_incrementer():
    runtime = TuringMachineRuntime(unary_incrementer_spec())
    # 111 -> 1111
    runtime.initialize("111")
    res = runtime.run()
    assert res.status == SimulationStatus.ACCEPT
    tape = runtime.current_config.tape
    result_str = "".join(tape.read(i) for i in range(4))
    assert result_str == "1111"


def test_palindrome_recognition():
    runtime = TuringMachineRuntime(palindrome_spec())
    # 101 -> palindrome -> ACCEPT
    runtime.initialize("101")
    assert runtime.run().status == SimulationStatus.ACCEPT

    # 1001 -> palindrome -> ACCEPT
    runtime.initialize("1001")
    assert runtime.run().status == SimulationStatus.ACCEPT

    # 110 -> not palindrome -> REJECT
    runtime.initialize("110")
    assert runtime.run().status == SimulationStatus.REJECT


def test_step_and_undo():
    runtime = TuringMachineRuntime(even_ones_spec())
    runtime.initialize("10")
    assert runtime.current_config.step_number == 0
    assert runtime.current_config.current_state == "q_even"

    # Step 1: reads '1' at index 0 -> writes '1', moves R, goes to q_odd
    step1 = runtime.step()
    assert step1.step_number == 1
    assert step1.configuration.current_state == "q_odd"
    assert step1.configuration.head_position == 1

    # Step 2: reads '0' at index 1 -> writes '0', moves R, stays in q_odd
    step2 = runtime.step()
    assert step2.step_number == 2
    assert step2.configuration.current_state == "q_odd"
    assert step2.configuration.head_position == 2

    # Undo step 2
    back1 = runtime.step_back()
    assert back1.step_number == 1
    assert runtime.current_config.current_state == "q_odd"
    assert runtime.current_config.head_position == 1

    # Undo step 1 -> back to initial
    back2 = runtime.step_back()
    assert back2.step_number == 0
    assert runtime.current_config.current_state == "q_even"
    assert runtime.current_config.head_position == 0


def test_undefined_transition_halt():
    data = {
        "schema_version": "1.0",
        "name": "Partial Machine",
        "machine_type": "deterministic_single_tape",
        "states": ["q0", "q_accept"],
        "input_alphabet": ["0"],
        "tape_alphabet": ["0", "_"],
        "blank_symbol": "_",
        "start_state": "q0",
        "accept_states": ["q_accept"],
        "reject_states": [],
        "transitions": [],  # No transitions defined
    }
    spec = TMSpecification.model_validate(data)
    runtime = TuringMachineRuntime(spec)
    runtime.initialize("0")
    res = runtime.step()
    assert res.status == SimulationStatus.HALTED_UNDEFINED_TRANSITION


def test_step_limit_timeout():
    # Infinite loop: in q0, read 0 -> write 0, stay, next_state q0
    data = {
        "schema_version": "1.0",
        "name": "Infinite Loop Machine",
        "machine_type": "deterministic_single_tape",
        "states": ["q0", "q_accept"],
        "input_alphabet": ["0"],
        "tape_alphabet": ["0", "_"],
        "blank_symbol": "_",
        "start_state": "q0",
        "accept_states": ["q_accept"],
        "reject_states": [],
        "transitions": [
            {"state": "q0", "read": "0", "write": "0", "move": "S", "next_state": "q0"},
        ],
    }
    spec = TMSpecification.model_validate(data)
    runtime = TuringMachineRuntime(spec, default_max_steps=50)
    runtime.initialize("0")
    res = runtime.run(max_steps=50)
    assert res.status == SimulationStatus.TIMEOUT
    assert res.steps_executed == 50
