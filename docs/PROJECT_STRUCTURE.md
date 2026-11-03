# Suggested Repository Structure

```text
turing-machine-studio/
├── README.md
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── TM_SPECIFICATION_SCHEMA.md
│   ├── COMPILER_AND_PROMPTS.md
│   ├── RUNTIME_AND_TAPE.md
│   ├── API_CONTRACTS.md
│   ├── UI_AND_VISUALIZATION.md
│   ├── TESTING_STRATEGY.md
│   └── ROADMAP.md
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── components/
│       │   │   ├── PromptEditor/
│       │   │   ├── Tape/
│       │   │   ├── TapeCell/
│       │   │   ├── HeadMarker/
│       │   │   ├── StatePanel/
│       │   │   ├── TransitionTable/
│       │   │   ├── PlaybackControls/
│       │   │   └── TracePanel/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── store/
│       │   └── services/
│       └── src-tauri/
├── backend/
│   ├── pyproject.toml
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── routes/
│       │   └── schemas/
│       ├── compiler/
│       │   ├── base.py
│       │   ├── prompt_builder.py
│       │   ├── providers/
│       │   │   ├── ollama.py
│       │   │   ├── hosted.py
│       │   │   └── mock.py
│       │   └── compiler_service.py
│       ├── validator/
│       │   ├── schema_validator.py
│       │   └── semantic_validator.py
│       ├── engine/
│       │   ├── machine.py
│       │   ├── tape.py
│       │   ├── transition.py
│       │   ├── configuration.py
│       │   ├── simulator.py
│       │   └── trace.py
│       ├── storage/
│       │   ├── database.py
│       │   └── repository.py
│       └── tests/
└── shared/
    └── schemas/
        └── tm_spec.schema.json
```

## Dependency direction
- UI calls frontend services.
- Frontend services call backend API.
- API routes call compiler, validator, runtime, and storage services.
- Runtime depends only on machine models and core logic.
- Compiler depends on provider abstraction and schema, not runtime.
- Visualization depends on runtime outputs, not backend internals.
