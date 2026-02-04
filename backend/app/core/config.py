"""
Application Configuration
All settings are loaded from environment variables with sensible defaults
"""
from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
import os

# Get the project root (LegalDrishti folder)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    .env file is in the main LegalDrishti folder (shared by backend & frontend)
    """
    
    # ===================
    # Application
    # ===================
    APP_NAME: str = "LegalDrishti"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # ===================
    # API
    # ===================
    API_PREFIX: str = "/api"
    
    # ===================
    # CORS
    # ===================
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    
    # ===================
    # Database (for future use)
    # ===================
    DATABASE_URL: Optional[str] = None
    
    # ===================
    # Redis (for future use - caching, sessions)
    # ===================
    REDIS_URL: Optional[str] = None
    
    # ===================
    # Ollama LLM
    # ===================
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:1b"
    OLLAMA_TIMEOUT: int = 60  # seconds
    
    # ===================
    # LLM Settings
    # ===================
    LLM_MAX_TOKENS: int = 150
    LLM_TEMPERATURE: float = 0.7
    
    # ===================
    # File Upload (for OCR, documents)
    # ===================
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 104857600  # 100MB
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg,doc,docx"
    
    # ===================
    # Security (for future auth)
    # ===================
    JWT_SECRET: str = "change-this-in-production-legaldrishti-2024"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    @property
    def cors_origins_list(self) -> list:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def allowed_extensions_list(self) -> list:
        """Convert comma-separated extensions to list"""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields like NEXT_PUBLIC_* (frontend only)


# Global settings instance
settings = Settings()


# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
