from ..db import get_pool

async def list_messages(conv_id: str, limit: int = 200):
    pool = await get_pool()
    rows = await pool.fetch("""
      select id, role, content, created_at
      from messages
      where conversation_id=$1
      order by created_at asc
      limit $2
    """, conv_id, limit)
    
    return [
        {
            "id": str(r["id"]),
            "role": r["role"],
            "content": r["content"],
            "timestamp": r["created_at"],   # ✅ normalized
        }
        for r in rows
    ]


async def add_message(
    conv_id: str,
    role: str,
    content: str,
    token_count: int | None = None,
    latency_ms: int | None = None
):
    pool = await get_pool()
    row = await pool.fetchrow("""
      insert into messages(conversation_id, role, content, token_count, latency_ms)
      values($1, $2, $3, $4, $5)
      returning id, role, content, created_at
    """, conv_id, role, content, token_count, latency_ms)

    return {
        "id": str(row["id"]),
        "role": row["role"],
        "content": row["content"],
        "timestamp": row["created_at"],   
    }
