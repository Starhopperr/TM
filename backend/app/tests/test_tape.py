import pytest
from app.engine.tape import SparseTape


def test_tape_read_unallocated_blank():
    tape = SparseTape(blank_symbol="_")
    assert tape.read(0) == "_"
    assert tape.read(-100) == "_"
    assert tape.read(5000) == "_"


def test_tape_write_and_overwrite():
    tape = SparseTape(blank_symbol="_")
    tape.write(0, "1")
    assert tape.read(0) == "1"
    tape.write(0, "0")
    assert tape.read(0) == "0"


def test_tape_remove_on_blank_write():
    tape = SparseTape(blank_symbol="_")
    tape.write(5, "A")
    assert tape.read(5) == "A"
    assert 5 in tape.to_dict()

    tape.write(5, "_")
    assert tape.read(5) == "_"
    assert 5 not in tape.to_dict()


def test_tape_negative_indexes():
    tape = SparseTape(blank_symbol="_")
    tape.write(-1, "X")
    tape.write(-9999, "Y")
    assert tape.read(-1) == "X"
    assert tape.read(-9999) == "Y"
    assert tape.read(-2) == "_"


def test_tape_input_initialization():
    tape = SparseTape.from_input("101", blank_symbol="_")
    assert tape.read(0) == "1"
    assert tape.read(1) == "0"
    assert tape.read(2) == "1"
    assert tape.read(3) == "_"
    assert tape.read(-1) == "_"
    nb = tape.non_blank_range()
    assert nb == (0, 2)


def test_tape_empty_input():
    tape = SparseTape.from_input("", blank_symbol="_")
    assert tape.read(0) == "_"
    assert tape.non_blank_range() is None
    assert tape.to_dict() == {}


def test_tape_clone_isolation():
    tape1 = SparseTape.from_input("abc", blank_symbol="_")
    tape2 = tape1.clone()
    tape2.write(0, "z")
    assert tape1.read(0) == "a"
    assert tape2.read(0) == "z"


def test_tape_get_window():
    tape = SparseTape.from_input("1", blank_symbol="_")
    window = tape.get_window(center=0, radius=2)
    assert len(window) == 5
    indices = [c["index"] for c in window]
    assert indices == [-2, -1, 0, 1, 2]
    symbols = [c["symbol"] for c in window]
    assert symbols == ["_", "_", "1", "_", "_"]
