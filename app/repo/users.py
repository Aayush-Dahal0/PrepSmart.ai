from ..db import get_pool

async def create_user_profile(user_id: str, extra: dict | None = None):
    pool = await get_pool()
    await pool.execute(
        "insert into user_profiles(user_id, extra) values($1, $2)",
        user_id, extra or {}
    )

async def get_user_profile(user_id: str):
    pool = await get_pool()
    return await pool.fetchrow("select * from user_profiles where user_id=$1", user_id)
