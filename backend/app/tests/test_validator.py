import pytest
from app.validator.semantic_validator import validate_tm_specification


def sample_valid_spec():
    return {
        "schema_version": "1.0",
        "name": "Even 1s",
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


def test_validator_valid_spec():
    res = validate_tm_specification(sample_valid_spec())
    assert res.valid is True
    assert len(res.errors) == 0


def test_validator_unknown_start_state():
    spec = sample_valid_spec()
    spec["start_state"] = "q_unknown"
    res = validate_tm_specification(spec)
    assert res.valid is False
    codes = [e.code for e in res.errors]
    assert "UNKNOWN_START_STATE" in codes


def test_validator_unknown_next_state():
    spec = sample_valid_spec()
    spec["transitions"][0]["next_state"] = "q_nonexistent"
    res = validate_tm_specification(spec)
    assert res.valid is False
    assert any(e.code == "UNKNOWN_STATE" for e in res.errors)


def test_validator_blank_in_input_alphabet():
    spec = sample_valid_spec()
    spec["input_alphabet"] = ["0", "1", "_"]
    res = validate_tm_specification(spec)
    assert res.valid is False
    assert any(e.code == "BLANK_IN_INPUT_ALPHABET" for e in res.errors)


def test_validator_input_not_subset_of_tape():
    spec = sample_valid_spec()
    spec["input_alphabet"] = ["0", "1", "2"]
    res = validate_tm_specification(spec)
    assert res.valid is False
    assert any(e.code == "INPUT_ALPHABET_NOT_SUBSET" for e in res.errors)


def test_validator_duplicate_transitions():
    spec = sample_valid_spec()
    # Add duplicate transition for (q_even, 0)
    spec["transitions"].append(
        {"state": "q_even", "read": "0", "write": "1", "move": "L", "next_state": "q_odd"}
    )
    res = validate_tm_specification(spec)
    assert res.valid is False
    assert any(e.code == "DUPLICATE_TRANSITION" for e in res.errors)


def test_validator_overlapping_accept_reject():
    spec = sample_valid_spec()
    spec["reject_states"] = ["q_accept"]
    res = validate_tm_specification(spec)
    assert res.valid is False
    assert any(e.code == "OVERLAPPING_HALT_STATES" for e in res.errors)


def test_validator_unreachable_state_warning():
    spec = sample_valid_spec()
    spec["states"].append("q_orphaned")
    res = validate_tm_specification(spec)
    assert res.valid is True  # Warning does not invalidate
    assert any(w.code == "UNREACHABLE_STATE" for w in res.warnings)
