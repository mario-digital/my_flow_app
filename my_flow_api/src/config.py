"""Application configuration using Pydantic Settings."""

from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "MyFlow API"

    # CORS Configuration
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database Configuration (placeholder - will be configured in later stories)
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "myflow_dev"

    # Auth Configuration (placeholder - will be configured in later stories)
    LOGTO_ENDPOINT: str = ""
    LOGTO_APP_ID: str = ""
    LOGTO_APP_SECRET: str = ""
    LOGTO_RESOURCE: str = ""

    # AI Configuration (placeholder - will be configured in later stories)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""


# Global settings instance
settings = Settings()