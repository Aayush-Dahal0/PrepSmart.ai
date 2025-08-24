import time, jwt
from passlib.context import CryptContext
from ..config import settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return pwd_ctx.verify(pw, hashed)

def create_access_token(sub: str, minutes: int = 60) -> str:
    now = int(time.time())
    payload = {"sub": sub, "iat": now, "exp": now + minutes * 60}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)
