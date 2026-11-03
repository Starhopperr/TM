import json
from ..base import LLMProvider


class MockLLMProvider(LLMProvider):
    """
    Mock provider for offline development and deterministic integration tests.
    Recognizes common patterns and produces verified schema-conforming machines or clarification questions.
    """

    async def generate_response(self, prompt: str, system_prompt: str) -> str:
        lower = prompt.lower()

        # Check for ambiguity scenario
        if any(w in lower for w in ["ambiguous", "underspecified", "something with", "maybe binary", "some string"]):
            return json.dumps({
                "status": "needs_clarification",
                "clarification_questions": [
                    "What is the input alphabet (e.g. {0, 1} or {a, b})?",
                    "Should the machine halt in an explicit accept state or reject state upon reaching blank?",
                ],
                "assumptions": [],
                "machine_spec": None,
            })

        # Palindrome
        if "palindrome" in lower:
            return json.dumps({
                "status": "success",
                "clarification_questions": [],
                "assumptions": [
                    "Input alphabet is binary {0, 1}.",
                    "Accepts if input string reads identically forwards and backwards; rejects otherwise.",
                ],
                "machine_spec": {
                    "schema_version": "1.0",
                    "name": "Binary Palindrome Recognizer",
                    "description": "Accepts binary strings that are palindromes, reading from edges inward.",
                    "machine_type": "deterministic_single_tape",
                    "states": ["q0", "q_saw0", "q_saw1", "q_check0", "q_check1", "q_back", "q_accept", "q_reject"],
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
                },
            })

        # Binary incrementer
        if "binary increment" in lower or "increment binary" in lower or "add 1" in lower or "add one" in lower:
            return json.dumps({
                "status": "success",
                "clarification_questions": [],
                "assumptions": [
                    "Input is a binary number with most significant bit at index 0.",
                    "Increments value by 1 with carry-over to left on overflow.",
                ],
                "machine_spec": {
                    "schema_version": "1.0",
                    "name": "Binary Incrementer",
                    "description": "Increments a binary number on the tape by 1.",
                    "machine_type": "deterministic_single_tape",
                    "states": ["q_scan", "q_carry", "q_halt"],
                    "input_alphabet": ["0", "1"],
                    "tape_alphabet": ["0", "1", "_"],
                    "blank_symbol": "_",
                    "start_state": "q_scan",
                    "accept_states": ["q_halt"],
                    "reject_states": [],
                    "transitions": [
                        {"state": "q_scan", "read": "0", "write": "0", "move": "R", "next_state": "q_scan"},
                        {"state": "q_scan", "read": "1", "write": "1", "move": "R", "next_state": "q_scan"},
                        {"state": "q_scan", "read": "_", "write": "_", "move": "L", "next_state": "q_carry"},
                        {"state": "q_carry", "read": "0", "write": "1", "move": "S", "next_state": "q_halt"},
                        {"state": "q_carry", "read": "1", "write": "0", "move": "L", "next_state": "q_carry"},
                        {"state": "q_carry", "read": "_", "write": "1", "move": "S", "next_state": "q_halt"},
                    ],
                },
            })

        # Invert bits / complement
        if "invert" in lower or "flip" in lower or "complement" in lower:
            return json.dumps({
                "status": "success",
                "clarification_questions": [],
                "assumptions": ["Inverts all bits (0->1, 1->0) until reaching blank symbol."],
                "machine_spec": {
                    "schema_version": "1.0",
                    "name": "Bit Inverter",
                    "description": "Inverts each binary bit until end of input.",
                    "machine_type": "deterministic_single_tape",
                    "states": ["q_flip", "q_halt"],
                    "input_alphabet": ["0", "1"],
                    "tape_alphabet": ["0", "1", "_"],
                    "blank_symbol": "_",
                    "start_state": "q_flip",
                    "accept_states": ["q_halt"],
                    "reject_states": [],
                    "transitions": [
                        {"state": "q_flip", "read": "0", "write": "1", "move": "R", "next_state": "q_flip"},
                        {"state": "q_flip", "read": "1", "write": "0", "move": "R", "next_state": "q_flip"},
                        {"state": "q_flip", "read": "_", "write": "_", "move": "S", "next_state": "q_halt"},
                    ],
                },
            })

        # Default / Even number of ones
        return json.dumps({
            "status": "success",
            "clarification_questions": [],
            "assumptions": [
                "Input alphabet is binary {0, 1}.",
                "Accepts if count of 1s is even (including 0 ones); rejects otherwise.",
            ],
            "machine_spec": {
                "schema_version": "1.0",
                "name": "Even Number of Ones",
                "description": "Accepts binary strings containing an even count of 1s.",
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
            },
        })
