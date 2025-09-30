"""Unit tests for configuration module."""


import pytest
from pydantic import ValidationError

from src.config import Settings


@pytest.fixture
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Remove all environment variables that Settings might read."""
    env_vars = [
        "ENV",
        "VERSION",
        "API_V1_STR",
        "PROJECT_NAME",
        "CORS_ORIGINS",
        "MONGODB_URI",
        "DATABASE_NAME",
        "LOGTO_ENDPOINT",
        "LOGTO_APP_ID",
        "LOGTO_APP_SECRET",
        "LOGTO_RESOURCE",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
    ]
    for var in env_vars:
        monkeypatch.delenv(var, raising=False)


def test_settings_defaults(clean_env: None) -> None:
    """Test that settings have correct default values."""
    settings = Settings(_env_file=None)  # type: ignore[call-arg]
    assert settings.VERSION == "0.1.0"
    assert settings.PROJECT_NAME == "MyFlow API"
    assert settings.ENV == "development"
    assert settings.API_V1_STR == "/api/v1"
    assert settings.CORS_ORIGINS == ["http://localhost:3000"]
    assert settings.MONGODB_URI == "mongodb://localhost:27017"
    assert settings.DATABASE_NAME == "myflow_dev"


def test_production_validation_fails_without_openai_key(clean_env: None) -> None:
    """Test that production environment requires OPENAI_API_KEY."""
    with pytest.raises(ValidationError, match="OPENAI_API_KEY is required in production"):
        Settings(
            _env_file=None,  # type: ignore[call-arg]
            ENV="production",
            OPENAI_API_KEY="",
            ANTHROPIC_API_KEY="test-key",
            LOGTO_ENDPOINT="https://test.logto.app",
            LOGTO_APP_ID="test-app-id",
            LOGTO_APP_SECRET="test-secret",
        )


def test_production_validation_fails_without_anthropic_key(clean_env: None) -> None:
    """Test that production environment requires ANTHROPIC_API_KEY."""
    with pytest.raises(ValidationError, match="ANTHROPIC_API_KEY is required in production"):
        Settings(
            _env_file=None,  # type: ignore[call-arg]
            ENV="production",
            OPENAI_API_KEY="test-key",
            ANTHROPIC_API_KEY="",
            LOGTO_ENDPOINT="https://test.logto.app",
            LOGTO_APP_ID="test-app-id",
            LOGTO_APP_SECRET="test-secret",
        )


def test_production_validation_fails_without_logto_config(clean_env: None) -> None:
    """Test that production environment requires Logto configuration."""
    with pytest.raises(ValidationError, match="Logto configuration is required in production"):
        Settings(
            _env_file=None,  # type: ignore[call-arg]
            ENV="production",
            OPENAI_API_KEY="test-key",
            ANTHROPIC_API_KEY="test-key",
            LOGTO_ENDPOINT="",
        )


def test_production_validation_passes_with_all_secrets(clean_env: None) -> None:
    """Test that production environment passes with all required secrets."""
    settings = Settings(
        _env_file=None,  # type: ignore[call-arg]
        ENV="production",
        OPENAI_API_KEY="test-openai-key",
        ANTHROPIC_API_KEY="test-anthropic-key",
        LOGTO_ENDPOINT="https://test.logto.app",
        LOGTO_APP_ID="test-app-id",
        LOGTO_APP_SECRET="test-secret",
    )
    assert settings.ENV == "production"
    assert settings.OPENAI_API_KEY == "test-openai-key"
    assert settings.ANTHROPIC_API_KEY == "test-anthropic-key"


def test_development_environment_allows_empty_secrets(clean_env: None) -> None:
    """Test that development environment allows empty API keys."""
    settings = Settings(_env_file=None, ENV="development")  # type: ignore[call-arg]
    assert settings.OPENAI_API_KEY == ""
    assert settings.ANTHROPIC_API_KEY == ""
    assert settings.LOGTO_ENDPOINT == ""
