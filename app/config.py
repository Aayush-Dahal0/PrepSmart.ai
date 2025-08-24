from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()  # loads .env automatically

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    CORS_ORIGINS: str = "*"
    OLLAMA_URL: str = "http://localhost:11434/api/chat"
    OLLAMA_MODEL: str = "llama3"

    class Config:
        env_file = ".env"
        extra = "ignore"  # <-- ignore extra fields in .env

settings = Settings()
