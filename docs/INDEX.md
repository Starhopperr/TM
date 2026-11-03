# Turing Studio Documentation Index

Use this folder as the source-of-truth project brief for an AI builder.

## Start here
1. `BUILDER_MASTER_PROMPT.md` — paste into the builder as the implementation instruction.
2. `README.md` — product vision, user journey, and MVP.
3. `SYSTEM_ARCHITECTURE.md` — architecture and boundaries.

## Detailed specifications
- `FUNCTIONAL_REQUIREMENTS.md` — functional and non-functional requirements.
- `TM_SPECIFICATION_SCHEMA.md` — canonical intermediate representation and validation rules.
- `COMPILER_AND_PROMPTS.md` — NL-to-TM compiler design and LLM prompt.
- `RUNTIME_AND_TAPE.md` — deterministic runtime and tape semantics.
- `API_CONTRACTS.md` — local backend endpoint contracts.
- `UI_AND_VISUALIZATION.md` — interface layout and behavior.
- `PROJECT_STRUCTURE.md` — repository organization.
- `TESTING_STRATEGY.md` — tests and acceptance scenarios.
- `ROADMAP.md` — milestone sequence and exit criteria.

## Suggested builder workflow
Give the builder `BUILDER_MASTER_PROMPT.md` first, then upload or paste the other files as project context. Ask it to implement milestone 1 and milestone 2 as a functioning vertical slice before attempting the LLM compiler.
