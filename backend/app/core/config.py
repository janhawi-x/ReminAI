from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_whisper_model: str = "whisper-large-v3"

    # Firebase
    firebase_service_account_key: str = "./serviceAccountKey.json"
    firebase_storage_bucket: str = ""

    # Security
    secret_key: str = "change-this-long-random-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    # App
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = ""
    environment: str = "development"

    # TTS
    tts_voice: str = "en-US-JennyNeural"
    tts_language: str = "en"

    # SMS (optional)
    sms_gateway_api_key: str = ""
    sms_gateway_url: str = ""

    class Config:
        # `.env.firebase` is local-only and contains only the path to the
        # service-account file, never the private key itself.
        env_file = (BACKEND_DIR / ".env", BACKEND_DIR / ".env.firebase")
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
