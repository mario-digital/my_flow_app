"""Integration tests for authentication routes."""

from unittest.mock import patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from jose import JWTError

from src.main import app


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


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


@pytest.mark.integration
class TestHealthEndpoint:
    """Integration tests for health check endpoint."""

    def test_health_endpoint_accessible_without_auth(self, client):
        """Test that health endpoint is accessible without authentication."""
        response = client.get("/api/v1/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "my-flow-api"
        assert "version" in data


@pytest.mark.integration
class TestProtectedEndpoint:
    """Integration tests for protected endpoint."""

    def test_protected_endpoint_requires_auth(self, client):
        """Test that protected endpoint requires authentication."""
        response = client.get("/api/v1/protected")

        # HTTPBearer returns 403 when Authorization header is missing
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_protected_endpoint_with_invalid_token(self, client, mock_jwks):
        """Test protected endpoint with invalid token."""
        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.side_effect = JWTError("Invalid signature")

            response = client.get(
                "/api/v1/protected",
                headers={"Authorization": "Bearer invalid-token"},
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            data = response.json()
            assert data["detail"]["message"].startswith("Invalid or expired token")
            assert "request_id" in data["detail"]

    def test_protected_endpoint_with_valid_token(self, client, mock_jwks):
        """Test protected endpoint with mocked valid token."""
        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.return_value = {"sub": "test-user-123"}

            response = client.get(
                "/api/v1/protected",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["user_id"] == "test-user-123"
            assert data["message"] == "This is a protected route"
            assert "timestamp" in data

    def test_protected_endpoint_returns_user_id(self, client, mock_jwks):
        """Test that protected endpoint returns user_id from token."""
        test_user_id = "user-abc-123"

        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.return_value = {"sub": test_user_id}

            response = client.get(
                "/api/v1/protected",
                headers={"Authorization": f"Bearer valid-token-{test_user_id}"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["user_id"] == test_user_id

    def test_protected_endpoint_with_missing_sub_claim(self, client, mock_jwks):
        """Test protected endpoint with token missing sub claim."""
        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.return_value = {}  # No sub claim

            response = client.get(
                "/api/v1/protected",
                headers={"Authorization": "Bearer token-without-sub"},
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            data = response.json()
            assert "missing user ID" in data["detail"]["message"]
            assert "request_id" in data["detail"]
