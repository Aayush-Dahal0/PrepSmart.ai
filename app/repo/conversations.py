from fastapi import HTTPException
from ..db import get_pool
import uuid
async def list_conversations(user_id: str):
    pool = await get_pool()
    rows = await pool.fetch("""
        select id, title, domain, created_at, updated_at
        from conversations
        where user_id = $1
        order by updated_at desc
    """, user_id)
    return [dict(r) for r in rows]

async def create_conversation(user_id: str, title: str, domain: str):
    pool = await get_pool()
    row = await pool.fetchrow("""
        insert into conversations(user_id, title, domain)
        values ($1, $2, $3)
        returning id
    """, user_id, title, domain)
    return str(row["id"])

async def delete_conversation(user_id: str, conv_id: str):
    pool = await get_pool()
    try:
        conv_id = uuid.UUID(conv_id)  # ensure valid UUID
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    result = await pool.execute("""
        DELETE FROM conversations
        WHERE id = $1 AND user_id = $2
    """, conv_id, user_id)

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
