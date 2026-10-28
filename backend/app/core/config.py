from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "TRACE X"
    app_version: str = "0.1.0"
    
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/tracex"
    redis_url: str = "redis://localhost:6379/0"
    
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    ai_provider: str = "mock"
    ai_api_key: Optional[str] = None
    ai_model: str = "gpt-4o"
    
    upload_dir: str = "./uploads"
    max_upload_size: int = 50 * 1024 * 1024
    
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    
    cors_origins: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()