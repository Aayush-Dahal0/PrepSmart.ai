import asyncio
from app.db import get_pool, close_pool

async def test():
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT NOW() as now;")
        print("Connected! Supabase time:", row["now"])
    await close_pool()

if __name__ == "__main__":
    asyncio.run(test())
