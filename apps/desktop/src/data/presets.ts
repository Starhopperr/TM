import type { TMSpecification } from "../types/tm";

export interface PresetMachine {
  id: string;
  name: string;
  description: string;
  defaultInput: string;
  spec: TMSpecification;
}

export const PRESET_MACHINES: PresetMachine[] = [
  {
    id: "even_ones",
    name: "Even Number of Ones",
    description: "Accepts binary strings containing an even number of 1s (including zero 1s). Rejects odd count.",
    defaultInput: "1010",
    spec: {
      schema_version: "1.0",
      name: "Even Number of Ones",
      description: "Accepts binary strings containing an even number of 1s.",
      machine_type: "deterministic_single_tape",
      states: ["q_even", "q_odd", "q_accept", "q_reject"],
      input_alphabet: ["0", "1"],
      tape_alphabet: ["0", "1", "_"],
      blank_symbol: "_",
      start_state: "q_even",
      accept_states: ["q_accept"],
      reject_states: ["q_reject"],
      transitions: [
        { state: "q_even", read: "0", write: "0", move: "R", next_state: "q_even" },
        { state: "q_even", read: "1", write: "1", move: "R", next_state: "q_odd" },
        { state: "q_even", read: "_", write: "_", move: "S", next_state: "q_accept" },
        { state: "q_odd", read: "0", write: "0", move: "R", next_state: "q_odd" },
        { state: "q_odd", read: "1", write: "1", move: "R", next_state: "q_even" },
        { state: "q_odd", read: "_", write: "_", move: "S", next_state: "q_reject" },
      ],
    },
  },
  {
    id: "palindrome",
    name: "Binary Palindrome Recognizer",
    description: "Accepts strings over {0,1} that read identically forwards and backwards (e.g. 1001, 101, 0).",
    defaultInput: "1001",
    spec: {
      schema_version: "1.0",
      name: "Binary Palindrome Recognizer",
      description: "Recognizes binary palindromes by iteratively matching outermost symbols and blanking them.",
      machine_type: "deterministic_single_tape",
      states: ["q0", "q_saw0", "q_saw1", "q_check0", "q_check1", "q_back", "q_accept", "q_reject"],
      input_alphabet: ["0", "1"],
      tape_alphabet: ["0", "1", "_"],
      blank_symbol: "_",
      start_state: "q0",
      accept_states: ["q_accept"],
      reject_states: ["q_reject"],
      transitions: [
        { state: "q0", read: "0", write: "_", move: "R", next_state: "q_saw0" },
        { state: "q0", read: "1", write: "_", move: "R", next_state: "q_saw1" },
        { state: "q0", read: "_", write: "_", move: "S", next_state: "q_accept" },

        { state: "q_saw0", read: "0", write: "0", move: "R", next_state: "q_saw0" },
        { state: "q_saw0", read: "1", write: "1", move: "R", next_state: "q_saw0" },
        { state: "q_saw0", read: "_", write: "_", move: "L", next_state: "q_check0" },

        { state: "q_check0", read: "0", write: "_", move: "L", next_state: "q_back" },
        { state: "q_check0", read: "_", write: "_", move: "S", next_state: "q_accept" },
        { state: "q_check0", read: "1", write: "1", move: "S", next_state: "q_reject" },

        { state: "q_saw1", read: "0", write: "0", move: "R", next_state: "q_saw1" },
        { state: "q_saw1", read: "1", write: "1", move: "R", next_state: "q_saw1" },
        { state: "q_saw1", read: "_", write: "_", move: "L", next_state: "q_check1" },

        { state: "q_check1", read: "1", write: "_", move: "L", next_state: "q_back" },
        { state: "q_check1", read: "_", write: "_", move: "S", next_state: "q_accept" },
        { state: "q_check1", read: "0", write: "0", move: "S", next_state: "q_reject" },

        { state: "q_back", read: "0", write: "0", move: "L", next_state: "q_back" },
        { state: "q_back", read: "1", write: "1", move: "L", next_state: "q_back" },
        { state: "q_back", read: "_", write: "_", move: "R", next_state: "q0" },
      ],
    },
  },
  {
    id: "binary_incrementer",
    name: "Binary Incrementer (+1)",
    description: "Adds 1 to a binary integer. E.g. '101' -> '110', '11' -> '100'.",
    defaultInput: "101",
    spec: {
      schema_version: "1.0",
      name: "Binary Incrementer",
      description: "Scans to least significant bit, adds 1 with carry leftwards.",
      machine_type: "deterministic_single_tape",
      states: ["q_scan", "q_carry", "q_halt"],
      input_alphabet: ["0", "1"],
      tape_alphabet: ["0", "1", "_"],
      blank_symbol: "_",
      start_state: "q_scan",
      accept_states: ["q_halt"],
      reject_states: [],
      transitions: [
        { state: "q_scan", read: "0", write: "0", move: "R", next_state: "q_scan" },
        { state: "q_scan", read: "1", write: "1", move: "R", next_state: "q_scan" },
        { state: "q_scan", read: "_", write: "_", move: "L", next_state: "q_carry" },
        { state: "q_carry", read: "0", write: "1", move: "S", next_state: "q_halt" },
        { state: "q_carry", read: "1", write: "0", move: "L", next_state: "q_carry" },
        { state: "q_carry", read: "_", write: "1", move: "S", next_state: "q_halt" },
      ],
    },
  },
  {
    id: "unary_incrementer",
    name: "Unary Incrementer (+1)",
    description: "Appends a 1 to a unary string. E.g. '111' -> '1111'.",
    defaultInput: "111",
    spec: {
      schema_version: "1.0",
      name: "Unary Incrementer",
      description: "Moves right past all 1s and writes a new 1 at the blank.",
      machine_type: "deterministic_single_tape",
      states: ["q_seek", "q_halt"],
      input_alphabet: ["1"],
      tape_alphabet: ["1", "_"],
      blank_symbol: "_",
      start_state: "q_seek",
      accept_states: ["q_halt"],
      reject_states: [],
      transitions: [
        { state: "q_seek", read: "1", write: "1", move: "R", next_state: "q_seek" },
        { state: "q_seek", read: "_", write: "1", move: "S", next_state: "q_halt" },
      ],
    },
  },
  {
    id: "bit_inverter",
    name: "Binary Bit Inverter",
    description: "Flips all bits in the input string: 0 -> 1 and 1 -> 0.",
    defaultInput: "10110",
    spec: {
      schema_version: "1.0",
      name: "Bit Inverter",
      description: "Inverts binary symbols until reaching blank.",
      machine_type: "deterministic_single_tape",
      states: ["q_flip", "q_halt"],
      input_alphabet: ["0", "1"],
      tape_alphabet: ["0", "1", "_"],
      blank_symbol: "_",
      start_state: "q_flip",
      accept_states: ["q_halt"],
      reject_states: [],
      transitions: [
        { state: "q_flip", read: "0", write: "1", move: "R", next_state: "q_flip" },
        { state: "q_flip", read: "1", write: "0", move: "R", next_state: "q_flip" },
        { state: "q_flip", read: "_", write: "_", move: "S", next_state: "q_halt" },
      ],
    },
  },
];
