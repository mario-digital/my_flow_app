"""Shared fixtures for router integration tests."""

from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.database import db_instance


# Mock database lifecycle at session level to prevent TestClient from requiring real MongoDB
@pytest.fixture(scope="session", autouse=True)
def mock_database_lifecycle():
    """
    Mock database connection and index creation at session level.

    This prevents TestClient from requiring real MongoDB when lifespan is triggered.
    Autouse=True ensures this runs for all tests in this directory.
    """
    # Create mock database instance
    mock_db = MagicMock()

    # Mock db_instance to have a valid db (prevents "Database not initialized" error)
    with (
        patch("src.database.connect_to_mongo", new_callable=AsyncMock),
        patch("src.database.close_mongo_connection", new_callable=AsyncMock),
        patch("src.main.ensure_indexes", new_callable=AsyncMock),
    ):
        original_db = db_instance.db
        db_instance.db = mock_db
        try:
            yield
        finally:
            db_instance.db = original_db


@pytest.fixture
def mock_jwks():
    """Mock JWKS for testing."""
    return {
        "keys": [
            {
                "kid": "test-key-id",
                "kty": "RSA",
                "use": "sig",
                "n": "test-modulus",
                "e": "AQAB",
            }
        ]
    }


@pytest.fixture
def mock_jwt_token_valid():
    """Mock valid JWT token payload."""
    return {"sub": "test_user_123"}


@pytest.fixture
def auth_headers():
    """Provide authorization headers for authenticated requests."""
    return {"Authorization": "Bearer valid-test-token"}


@pytest.fixture(autouse=True)
def cleanup_dependency_overrides():
    """
    Auto-cleanup dependency overrides after each test.

    Ensures app.dependency_overrides dict is cleared between tests
    to prevent test contamination.
    """
    from src.main import app

    yield
    # Cleanup after test
    app.dependency_overrides.clear()


@contextmanager
def mock_auth_success(user_id: str = "test_user_123"):
    """
    Context manager to mock successful JWT authentication.

    Usage:
        with mock_auth_success():
            # Mock repository dependencies
            app.dependency_overrides[get_context_repository] = lambda: mock_repo
            response = client.get("/api/v1/contexts", headers={"Authorization": "Bearer token"})
    """
    mock_jwks = {
        "keys": [
            {
                "kid": "test-key-id",
                "kty": "RSA",
                "use": "sig",
                "n": "test-modulus",
                "e": "AQAB",
            }
        ]
    }

    with (
        patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
        patch("src.middleware.auth.jwt.get_unverified_header", return_value={"kid": "test-key-id"}),
        patch("src.middleware.auth.jwt.decode", return_value={"sub": user_id}),
    ):
        yield


def create_mock_context_repository(**method_mocks):
    """
    Create a mock ContextRepository with specified method implementations.

    Usage:
        mock_repo = create_mock_context_repository(
            count_by_user=AsyncMock(return_value=5),
            get_all_by_user=AsyncMock(return_value=[...])
        )
    """
    mock = MagicMock()
    for method_name, mock_impl in method_mocks.items():
        setattr(mock, method_name, mock_impl)
    return mock


def create_mock_flow_repository(**method_mocks):
    """
    Create a mock FlowRepository with specified method implementations.

    Usage:
        mock_repo = create_mock_flow_repository(
            delete_by_context_id=AsyncMock(return_value=10)
        )
    """
    mock = MagicMock()
    for method_name, mock_impl in method_mocks.items():
        setattr(mock, method_name, mock_impl)
    return mock
