from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from .config import settings

async def get_current_user_id(authorization: str = Header(...)):
    """
    Verifies Supabase JWT and extracts user_id (sub).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.JWT_ALG],
            options={"verify_aud": False}  # Supabase doesn't always include aud
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")  # Supabase user id
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return user_id
