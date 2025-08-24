from fastapi import HTTPException
from ..db import get_pool

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
    result = await pool.execute("""
        delete from conversations
        where id = $1 and user_id = $2
    """, conv_id, user_id)
    # asyncpg returns 'DELETE <count>'
    if result.split()[-1] == "0":
        raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
