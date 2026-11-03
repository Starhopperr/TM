import json
import httpx
from ..base import LLMProvider


class OllamaProvider(LLMProvider):
    """Local Ollama provider adapter."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2:3b", timeout: float = 60.0):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    async def generate_response(self, prompt: str, system_prompt: str) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "format": "json",
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("response", "{}")
            except httpx.ConnectError:
                raise ConnectionError(
                    f"Could not connect to Ollama at {self.base_url}. Ensure Ollama is running (`ollama serve`)."
                )
            except Exception as e:
                raise RuntimeError(f"Ollama generation failed: {str(e)}")
