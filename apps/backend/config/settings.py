"""
Application Configuration

Loads configuration from environment variables using Pydantic Settings.
Follows 12-factor app principles for configuration management.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
import json


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All sensitive values should be stored in .env file, never committed to git.
    """

    # ========================================================================
    # ENVIRONMENT
    # ========================================================================
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    API_URL: str = "http://localhost:8000"

    # ========================================================================
    # SUPABASE
    # ========================================================================
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    @property
    def supabase_url(self) -> str:
        """Supabase project URL"""
        return self.SUPABASE_URL

    @property
    def supabase_anon_key(self) -> str:
        """Supabase anonymous (public) key - safe for frontend"""
        return self.SUPABASE_ANON_KEY

    @property
    def supabase_service_role_key(self) -> str:
        """
        Supabase service role key - bypasses RLS, server-side only!
        NEVER expose to frontend.
        """
        return self.SUPABASE_SERVICE_ROLE_KEY

    # ========================================================================
    # OPENAI
    # ========================================================================
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_WHISPER_MODEL: str = "whisper-1"
    OPENAI_MAX_TOKENS: int = 4000
    OPENAI_TEMPERATURE: float = 0.7

    # ========================================================================
    # GOOGLE CLOUD (for Google Slides API)
    # ========================================================================
    GOOGLE_SERVICE_ACCOUNT_KEY: str  # JSON string

    @property
    def google_credentials_dict(self) -> dict:
        """Parse Google service account key from JSON string"""
        try:
            return json.loads(self.GOOGLE_SERVICE_ACCOUNT_KEY)
        except json.JSONDecodeError:
            raise ValueError("Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON")

    # ========================================================================
    # EMAIL
    # ========================================================================
    EMAIL_FROM: str = "noreply@slidebanai.com"
    EMAIL_PROVIDER: str = "supabase"  # supabase, resend, sendgrid

    # ========================================================================
    # SECURITY
    # ========================================================================
    SECRET_KEY: str = "your-secret-key-min-32-chars-change-in-production"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "https://slidebanai.vercel.app"
    ]

    # ========================================================================
    # RATE LIMITING
    # ========================================================================
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100

    # ========================================================================
    # FILE UPLOAD
    # ========================================================================
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_DOCUMENT_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # DOCX
        "application/vnd.ms-powerpoint",  # PPT
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # PPTX
        "image/png",
        "image/jpeg"
    ]

    # ========================================================================
    # AI SETTINGS
    # ========================================================================
    AI_PRESENTATION_MIN_SLIDES: int = 3
    AI_PRESENTATION_MAX_SLIDES: int = 30
    AI_PRESENTATION_DEFAULT_SLIDES: int = 10

    COACH_MIN_TRANSCRIPT_LENGTH: int = 10
    COACH_MAX_VIDEO_SIZE_MB: int = 100

    # ========================================================================
    # PERFORMANCE
    # ========================================================================
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # ========================================================================
    # LOGGING
    # ========================================================================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text

    # ========================================================================
    # PYDANTIC SETTINGS
    # ========================================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Create global settings instance
settings = Settings()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_cors_origins() -> List[str]:
    """
    Get CORS origins based on environment.

    In production, this should be restricted to actual domains.
    In development, allows localhost.
    """
    if settings.ENVIRONMENT == "production":
        return [
            "https://slidebanai.com",
            "https://www.slidebanai.com",
            "https://app.slidebanai.com"
        ]
    else:
        return settings.CORS_ORIGINS


def is_production() -> bool:
    """Check if running in production environment"""
    return settings.ENVIRONMENT == "production"


def is_development() -> bool:
    """Check if running in development environment"""
    return settings.ENVIRONMENT == "development"
