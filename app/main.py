import time, asyncio, json
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, ORJSONResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

from .config import settings
from .db import get_pool, close_pool
from .auth_supabase import verify_token, supabase
from .repo import conversations as conv_repo, messages as msg_repo
from .services.chat import stream_ollama, SYSTEM_PROMPT

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

class RenameConversationIn(BaseModel):
    title: str

@app.get("/conversations")
@limiter.limit("120/minute")
async def list_conversations(
    request: Request,
    user_id: str = Depends(verify_token)
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

@app.put("/conversations/{conv_id}")
@limiter.limit("60/minute")
async def rename_conversation(
    request: Request,
    conv_id: str,
    body: RenameConversationIn,
    user_id: str = Depends(verify_token)
):
    success = await conv_repo.update_conversation_title(user_id, conv_id, body.title)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True, "message": "Conversation renamed successfully"}

@app.delete("/conversations/{conv_id}")
@limiter.limit("60/minute")
async def delete_conversation(
    request: Request,
    conv_id: str,
    user_id: str = Depends(verify_token)
):
    await conv_repo.delete_conversation(user_id, conv_id)
    return {"ok": True}

# ---------------- User Profile & Auth ----------------
class UpdateProfileIn(BaseModel):
    name: str

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

@app.put("/user/profile")
@limiter.limit("60/minute")
async def update_profile(
    request: Request,
    body: UpdateProfileIn,
    user_id: str = Depends(verify_token)
):
    try:
        result = supabase.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": {"name": body.name}}
        )
        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update profile: {str(e)}")

@app.post("/user/change-password")
@limiter.limit("30/minute")
async def change_password(
    request: Request,
    body: ChangePasswordIn,
    user_id: str = Depends(verify_token)
):
    try:
        user_response = supabase.auth.admin.get_user_by_id(user_id)
        user_email = user_response.user.email

        try:
            supabase.auth.sign_in_with_password({
                "email": user_email,
                "password": body.current_password
            })
        except:
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        supabase.auth.admin.update_user_by_id(
            user_id,
            {"password": body.new_password}
        )

        return {"success": True, "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to change password: {str(e)}")

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
            text = chunk.get("content", "") if isinstance(chunk, dict) else str(chunk)
            buffer += text

            event = {
                "role": "assistant",
                "content": text,
                "timestamp": time.time(),
                "final": False
            }
            yield f"data: {json.dumps(event)}\n\n"

            if await request.is_disconnected():
                break

        saved = await msg_repo.add_message(
            conv_id,
            "assistant",
            buffer,
            latency_ms=int((time.time() - start) * 1000),
        )

        saved["final"] = True  # ✅ mark final
        yield f"data: {json.dumps(saved)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
