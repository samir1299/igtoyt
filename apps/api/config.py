import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Redis (or SQLAlchemy fallback)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SQLALCHEMY_DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # AI
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL_LARGE: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_SMALL: str = "llama-3.1-8b-instant"
    GROQ_VISION_MODEL: str = "llama-3.2-90b-vision-preview"

    # Web Search
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")

    # YouTube
    YOUTUBE_CLIENT_ID: str = os.getenv("YOUTUBE_CLIENT_ID", "")
    YOUTUBE_CLIENT_SECRET: str = os.getenv("YOUTUBE_CLIENT_SECRET", "")

    # App
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-min-32-chars")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"

settings = Settings()
