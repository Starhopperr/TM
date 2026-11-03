# Local API Contracts

The API is an implementation boundary between desktop UI and backend. The same services can later be invoked in-process.

## POST /api/tm/compile
Request:

```json
{
  "prompt": "Accept binary strings with an even number of 1s.",
  "provider": "ollama",
  "model": "configured-model-name"
}
```

Response (success):

```json
{
  "status": "success",
  "clarification_questions": [],
  "assumptions": ["The input alphabet is {0,1}."],
  "machine_spec": {}
}
```

Response (clarification):

```json
{
  "status": "needs_clarification",
  "clarification_questions": ["What should happen when the head reads blank?"],
  "assumptions": [],
  "machine_spec": null
}
```

## POST /api/tm/validate
Request:

```json
{
  "machine_spec": {}
}
```

Response:

```json
{
  "valid": false,
  "errors": [
    {
      "code": "UNKNOWN_STATE",
      "path": "transitions[0].next_state",
      "message": "Transition references an undeclared state."
    }
  ],
  "warnings": []
}
```

## POST /api/tm/simulation/create
Request:

```json
{
  "machine_spec": {},
  "input_string": "1010",
  "options": {
    "max_steps": 10000,
    "undefined_transition": "halt"
  }
}
```

Response:

```json
{
  "simulation_id": "local-id",
  "configuration": {
    "step_number": 0,
    "current_state": "q0",
    "head_position": 0,
    "visible_tape": []
  },
  "status": "RUNNING"
}
```

## POST /api/tm/simulation/step
Request:

```json
{
  "simulation_id": "local-id"
}
```

Response:

```json
{
  "step_number": 1,
  "configuration": {},
  "transition_applied": {},
  "status": "RUNNING"
}
```

## POST /api/tm/simulation/run
Request:

```json
{
  "simulation_id": "local-id",
  "max_steps": 10000,
  "breakpoints": {
    "states": [],
    "transition_ids": []
  }
}
```

Response:

```json
{
  "steps_executed": 24,
  "final_configuration": {},
  "status": "ACCEPT"
}
```

## POST /api/tm/simulation/reset
Request:

```json
{
  "simulation_id": "local-id"
}
```

Response:
- Initial configuration.
- Status `RUNNING`.

## GET /api/tm/simulation/trace
Query:
- `simulation_id`
- Optional `start_step`
- Optional `limit`

Response:
- Ordered trace entries.
- Pagination metadata if needed.

## POST /api/tm/export
Request:

```json
{
  "machine_spec": {},
  "format": "json"
}
```

MVP format: `json`. Later: `markdown`, `svg`, `png`.

## API implementation notes
- Use Pydantic request and response models.
- Return consistent error codes and structured messages.
- Never trust frontend validation alone.
- Local API should bind only to localhost.
- Avoid exposing secrets in logs.
