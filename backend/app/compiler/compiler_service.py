import json
import re
from typing import Optional, Any
from .base import CompilerResponse, LLMProvider
from .prompt_builder import SYSTEM_PROMPT, build_compilation_prompt, build_repair_prompt
from .providers.mock import MockLLMProvider
from .providers.ollama import OllamaProvider
from .providers.hosted import HostedOpenAIProvider
from ..validator.semantic_validator import validate_tm_specification
from ..engine.machine import TMSpecification


class CompilerService:
    """Orchestrates natural-language to Turing machine compilation with validation & repair loop."""

    def __init__(self, default_provider: Optional[LLMProvider] = None):
        self.default_provider = default_provider or MockLLMProvider()

    def get_provider(
        self,
        provider_name: str = "mock",
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> LLMProvider:
        p_name = provider_name.lower()
        if p_name == "ollama":
            url = base_url or "http://localhost:11434"
            m = model or "llama3.2:3b"
            return OllamaProvider(base_url=url, model=m)
        elif p_name in ("hosted", "openai"):
            key = api_key or ""
            url = base_url or "https://api.openai.com/v1"
            m = model or "gpt-4o-mini"
            return HostedOpenAIProvider(api_key=key, base_url=url, model=m)
        else:
            return MockLLMProvider()

    def _extract_json(self, text: str) -> dict[str, Any]:
        """Extract JSON object from string, stripping Markdown code fences if present."""
        text = text.strip()
        # Strip markdown ```json ... ```
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if fence_match:
            text = fence_match.group(1).strip()
        return json.loads(text)

    def _normalize_spec_dict(self, spec: dict[str, Any]) -> dict[str, Any]:
        """
        Auto-reconcile minor omissions typical of lightweight models (e.g. 3B models):
        - Include all states used in transitions and halting states into `states`.
        - Ensure `blank_symbol` is in `tape_alphabet` and excluded from `input_alphabet`.
        - Ensure all symbols used in transitions and input_alphabet are in `tape_alphabet`.
        """
        if not isinstance(spec, dict):
            return spec

        blank = spec.get("blank_symbol", "_")
        spec["blank_symbol"] = blank

        # Reconcile states
        declared_states = list(dict.fromkeys(spec.get("states", [])))
        all_states_set = set(declared_states)

        if spec.get("start_state"):
            all_states_set.add(spec["start_state"])

        for s in spec.get("accept_states", []):
            all_states_set.add(s)
        for s in spec.get("reject_states", []):
            all_states_set.add(s)

        transitions = spec.get("transitions", [])
        if isinstance(transitions, list):
            for t in transitions:
                if isinstance(t, dict):
                    if t.get("state"):
                        all_states_set.add(t["state"])
                    if t.get("next_state"):
                        all_states_set.add(t["next_state"])

        spec["states"] = list(all_states_set)

        # Reconcile alphabets
        tape_set = set(spec.get("tape_alphabet", []))
        tape_set.add(blank)

        input_alphabet = [sym for sym in spec.get("input_alphabet", []) if sym != blank]
        for sym in input_alphabet:
            tape_set.add(sym)

        if isinstance(transitions, list):
            for t in transitions:
                if isinstance(t, dict):
                    if t.get("read"):
                        tape_set.add(t["read"])
                    if t.get("write"):
                        tape_set.add(t["write"])

        spec["input_alphabet"] = list(dict.fromkeys(input_alphabet))
        spec["tape_alphabet"] = list(tape_set)
        return spec

    async def compile(
        self,
        prompt: str,
        clarification_answers: str = "",
        provider: Optional[LLMProvider] = None,
        max_repairs: int = 2,
    ) -> CompilerResponse:
        active_provider = provider or self.default_provider

        initial_user_prompt = build_compilation_prompt(prompt, clarification_answers)

        try:
            raw_response = await active_provider.generate_response(initial_user_prompt, SYSTEM_PROMPT)
        except Exception as e:
            return CompilerResponse(
                status="error",
                error_message=f"LLM Provider error: {str(e)}",
                raw_output=None,
            )

        current_raw = raw_response
        for attempt in range(max_repairs + 1):
            try:
                data = self._extract_json(current_raw)
            except json.JSONDecodeError as e:
                if attempt < max_repairs:
                    repair_prompt = f"Previous output was not valid JSON. Error: {str(e)}. Output raw JSON conforming to schema."
                    current_raw = await active_provider.generate_response(repair_prompt, SYSTEM_PROMPT)
                    continue
                return CompilerResponse(
                    status="error",
                    error_message=f"Failed to parse model response as JSON: {str(e)}",
                    raw_output=current_raw,
                )

            status = data.get("status", "success")
            if status == "needs_clarification":
                return CompilerResponse(
                    status="needs_clarification",
                    clarification_questions=data.get("clarification_questions", []),
                    assumptions=data.get("assumptions", []),
                    machine_spec=None,
                    raw_output=current_raw,
                )

            spec_dict = data.get("machine_spec")
            if not spec_dict:
                # If machine_spec was omitted but root is the spec itself
                if "transitions" in data and "states" in data:
                    spec_dict = data

            if not spec_dict:
                if attempt < max_repairs:
                    repair_prompt = "Response did not contain machine_spec. Provide machine_spec in schema."
                    current_raw = await active_provider.generate_response(repair_prompt, SYSTEM_PROMPT)
                    continue
                return CompilerResponse(
                    status="error",
                    error_message="Response missing machine_spec object.",
                    raw_output=current_raw,
                )

            # Normalize minor state/alphabet omissions typical of lightweight 3B models
            spec_dict = self._normalize_spec_dict(spec_dict)

            # Validate specification
            val_res = validate_tm_specification(spec_dict)
            if val_res.valid and val_res.parsed_spec:
                return CompilerResponse(
                    status="success",
                    clarification_questions=[],
                    assumptions=data.get("assumptions", []),
                    machine_spec=val_res.parsed_spec,
                    raw_output=current_raw,
                )

            # If invalid and we have repairs left, invoke repair loop
            if attempt < max_repairs:
                error_strings = [f"{e.code} at {e.path}: {e.message}" for e in val_res.errors]
                repair_prompt = build_repair_prompt(prompt, json.dumps(spec_dict), error_strings)
                try:
                    current_raw = await active_provider.generate_response(repair_prompt, SYSTEM_PROMPT)
                except Exception as e:
                    return CompilerResponse(
                        status="error",
                        error_message=f"Repair query failed: {str(e)}",
                        raw_output=current_raw,
                    )
            else:
                return CompilerResponse(
                    status="error",
                    error_message=f"Machine specification failed validation after {max_repairs} repair attempts: "
                    + "; ".join(e.message for e in val_res.errors),
                    raw_output=current_raw,
                )

        return CompilerResponse(
            status="error",
            error_message="Compilation failed.",
            raw_output=current_raw,
        )
