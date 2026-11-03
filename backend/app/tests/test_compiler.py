import pytest
from app.compiler.compiler_service import CompilerService
from app.compiler.providers.mock import MockLLMProvider


@pytest.mark.asyncio
async def test_compiler_mock_success():
    service = CompilerService(MockLLMProvider())
    resp = await service.compile("Recognize palindromes over binary alphabet")
    assert resp.status == "success"
    assert resp.machine_spec is not None
    assert resp.machine_spec.name == "Binary Palindrome Recognizer"
    assert "q0" in resp.machine_spec.states
    assert len(resp.machine_spec.transitions) > 0


@pytest.mark.asyncio
async def test_compiler_mock_clarification():
    service = CompilerService(MockLLMProvider())
    resp = await service.compile("Do something with some strings maybe binary")
    assert resp.status == "needs_clarification"
    assert len(resp.clarification_questions) > 0
    assert resp.machine_spec is None
