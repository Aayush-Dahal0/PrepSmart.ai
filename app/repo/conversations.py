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
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "domain": r["domain"],
            "timestamp": r["created_at"],      
            "last_updated": r["updated_at"], 
        }
        for r in rows
    ]

async def create_conversation(user_id: str, title: str, domain: str):
    pool = await get_pool()
    row = await pool.fetchrow("""
        insert into conversations(user_id, title, domain)
        values ($1, $2, $3)
        returning id, title, domain, created_at, updated_at
    """, user_id, title, domain)
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "domain": row["domain"],
        "timestamp": row["created_at"],
        "last_updated": row["updated_at"],
    }

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

    return {"status": "success", "id": str(conv_id)}  # 
