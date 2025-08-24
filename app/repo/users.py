from ..db import get_pool

async def create_user(email: str, password_hash: str) -> str:
    pool = await get_pool()
    row = await pool.fetchrow(
        """insert into users(email, password_hash) values($1,$2) returning id""",
        email, password_hash
    )
    return str(row["id"])

async def get_user_by_email(email: str):
    pool = await get_pool()
    return await pool.fetchrow("select * from users where email=$1", email)
