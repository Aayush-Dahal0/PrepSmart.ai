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
    return [dict(r) for r in rows]

async def add_message(conv_id: str, role: str, content: str, token_count: int | None = None, latency_ms: int | None = None):
    pool = await get_pool()
    await pool.execute("""
      insert into messages(conversation_id, role, content, token_count, latency_ms)
      values($1,$2,$3,$4,$5)
    """, conv_id, role, content, token_count, latency_ms)
