from fastapi import HTTPException, Header, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx, os
from jose import jwt, JWTError
import json

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_PROJECT_ID = SUPABASE_URL.split("//")[1].split(".")[0] if SUPABASE_URL else None

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_JWT_SECRET:
    raise RuntimeError("Supabase credentials missing in .env")

# ---- Signup / Login (unchanged) ----
from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def signup(email: str, password: str):
    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        return {"message": "Signup successful. Verify your email.", "user": res.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def login(email: str, password: str):
    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": res.user,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---- Verify Token (using HS256 + JWT_SECRET) ----
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    
    print(f"Verifying token with HS256...")  # Debug log
    
    try:
        # Decode and verify the token using HS256 + JWT_SECRET
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"https://{SUPABASE_PROJECT_ID}.supabase.co/auth/v1"
        )
        
    except JWTError as e:
        print(f"JWT Error with validation: {e}")  # Debug log
        try:
            # Try without audience/issuer validation
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False, "verify_iss": False}
            )
            print("JWT decode without validation succeeded")  # Debug log
        except JWTError as e2:
            print(f"JWT Error without validation: {e2}")  # Debug log
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {e2}",
            )
    except Exception as e:
        print(f"Unexpected error: {e}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {e}",
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no subject")

    print(f"Token verified successfully for user: {user_id}")  # Debug log
    return user_id