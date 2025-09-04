import time, asyncio
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, ORJSONResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

from .config import settings
from .db import get_pool, close_pool
from .auth_supabase import verify_token  # <-- now uses JWKS
from .repo import conversations as conv_repo, messages as msg_repo
from .services.chat import stream_ollama, SYSTEM_PROMPT  # <-- Ollama

app = FastAPI(title="AI Interviewer API", default_response_class=ORJSONResponse)

# ---------------- CORS ----------------
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Rate limiting ----------------
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ---------------- Startup / Shutdown ----------------
@app.on_event("startup")
async def _startup():
    await get_pool()

@app.on_event("shutdown")
async def _shutdown():
    await close_pool()

# ---------------- Health Check ----------------
@app.get("/health")
async def health():
    return {"ok": True}

# ---------------- Conversations ----------------
class CreateConvIn(BaseModel):
    title: str = "New Interview"
    domain: str = "general"

@app.get("/conversations")
@limiter.limit("120/minute")
async def list_conversations(
    request: Request,
    user_id: str = Depends(verify_token)  # ✅ Supabase user
):
    return await conv_repo.list_conversations(user_id)

@app.post("/conversations")
@limiter.limit("60/minute")
async def create_conversation(
    request: Request,
    body: CreateConvIn,
    user_id: str = Depends(verify_token)
):
    return await conv_repo.create_conversation(user_id, body.title, body.domain)

@app.delete("/conversations/{conv_id}")
@limiter.limit("60/minute")
async def delete_conversation(
    request: Request,
    conv_id: str,
    user_id: str = Depends(verify_token)
):
    await conv_repo.delete_conversation(user_id, conv_id)
    return {"ok": True}

# ---------------- Messages ----------------
@app.get("/messages/{conv_id}")
@limiter.limit("120/minute")
async def list_messages(
    request: Request,
    conv_id: str,
    user_id: str = Depends(verify_token)
):
    return await msg_repo.list_messages(conv_id)

# ---------------- Chat (SSE streaming) ----------------
class ChatIn(BaseModel):
    conversation_id: str
    user_message: str

@app.post("/chat/stream")
@limiter.limit("30/minute")
async def chat_stream(
    request: Request,
    payload: ChatIn,
    user_id: str = Depends(verify_token)
):
    conv_id = payload.conversation_id
    history = await msg_repo.list_messages(conv_id, limit=50)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in history:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": payload.user_message})

    await msg_repo.add_message(conv_id, "user", payload.user_message)

    async def event_gen():
        start = time.time()
        buffer = ""
        async for chunk in stream_ollama(messages):
            buffer += chunk
            yield f"data: {chunk}\n\n"
            if await request.is_disconnected():
                break
        await msg_repo.add_message(conv_id, "assistant", buffer, latency_ms=int((time.time() - start) * 1000))
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
