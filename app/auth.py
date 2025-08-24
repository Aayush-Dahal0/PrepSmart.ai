from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from .services.security import hash_password, verify_password, create_access_token
from .repo import users as user_repo

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterIn(BaseModel):
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(body: RegisterIn):
    if await user_repo.get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = await user_repo.create_user(body.email, hash_password(body.password))
    return {"user_id": uid}

@router.post("/login")
async def login(body: LoginIn):
    u = await user_repo.get_user_by_email(body.email)
    if not u or not verify_password(body.password, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(u["id"]))
    return {"access": token}
