"""Application configuration using Pydantic Settings."""

from typing import ClassVar

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Pydantic's BaseSettings inherits from BaseModel[Any]; targeted ignore keeps strict mypy happy.
class Settings(BaseSettings):  # type: ignore[explicit-any]
    """Application settings loaded from environment variables."""

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application Configuration
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "MyFlow API"
    ENV: str = "development"  # development, staging, production

    # CORS Configuration
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database Configuration (placeholder - will be configured in later stories)
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "myflow_dev"

    # Logto Authentication Configuration
    # Defaults let local tests run without secrets; production validator enforces real values
    LOGTO_ENDPOINT: str = ""
    LOGTO_APP_ID: str = ""
    LOGTO_APP_SECRET: str = ""
    LOGTO_RESOURCE: str | None = None
    LOGTO_JWKS_TIMEOUT_SECONDS: float = 5.0
    LOGTO_JWKS_CACHE_TTL_SECONDS: float = 3600.0

    # AI Configuration (placeholder - will be configured in later stories)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        """Validate that required secrets are set in production environment."""
        if self.ENV == "production":
            if not self.OPENAI_API_KEY:
                msg = "OPENAI_API_KEY is required in production"
                raise ValueError(msg)
            if not self.ANTHROPIC_API_KEY:
                msg = "ANTHROPIC_API_KEY is required in production"
                raise ValueError(msg)
            if not self.LOGTO_ENDPOINT or not self.LOGTO_APP_ID or not self.LOGTO_APP_SECRET:
                msg = "Logto configuration is required in production"
                raise ValueError(msg)
        return self

    @model_validator(mode="after")
    def validate_database_connection(self) -> "Settings":
        """Validate MongoDB URI format for development and staging environments."""
        if self.ENV in ["development", "staging"] and not self.MONGODB_URI.startswith(
            ("mongodb://", "mongodb+srv://")
        ):
            msg = "Invalid MongoDB URI format - must start with mongodb:// or mongodb+srv://"
            raise ValueError(msg)
        return self


# Global settings instance
# Pydantic Settings loads required fields from environment variables at import time.
settings = Settings()
