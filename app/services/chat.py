import httpx
import json
from datetime import datetime
from fastapi import HTTPException
from ..config import settings

SYSTEM_PROMPT = (
    "You are an AI interviewer. Ask one question at a time for the chosen domain. "
    "After a short exchange, give a brief score + actionable tips."
)

async def stream_ollama(messages: list[dict]):
    """
    Stream text chunks from a local Ollama server (/api/chat).
    `messages` should be a list of {role, content}.
    """
    model = getattr(settings, "OLLAMA_MODEL", "llama3")
    url = getattr(settings, "OLLAMA_URL", "http://localhost:11434/api/chat")

    # Always inject system message at start
    if not messages or messages[0].get("role") != "system":
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    payload = {"model": model, "messages": messages, "stream": True}

    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=payload) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    if "message" in data:
                        chunk = data["message"].get("content", "")
                        if chunk:
                            yield {
                                "role": "assistant",
                                "content": chunk,
                                "timestamp": datetime.utcnow().isoformat(),
                            }

                    if data.get("done"):
                        break
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ollama API error: {e}")
