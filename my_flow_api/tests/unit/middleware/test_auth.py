"""Unit tests for Logto JWT authentication middleware."""

from unittest.mock import Mock, patch

import httpx
import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import ExpiredSignatureError, JWTError

from src.middleware.auth import get_current_user, get_logto_jwks


@pytest.fixture
def mock_jwks() -> dict:
    """Return mock JWKS for testing."""
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
def mock_settings():
    """Mock settings for tests."""
    with patch("src.middleware.auth.settings") as mock:
        mock.LOGTO_ENDPOINT = "https://test.logto.app"
        mock.LOGTO_APP_ID = "test-app-id"
        yield mock


@pytest.mark.unit
class TestGetLogtoJwks:
    """Unit tests for get_logto_jwks function."""

    def test_get_logto_jwks_success(self, mock_settings, mock_jwks):
        """Test successful JWKS fetch and caching."""
        # Clear cache before test
        get_logto_jwks.cache_clear()

        with patch("httpx.get") as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = mock_jwks
            mock_get.return_value = mock_response

            result = get_logto_jwks()

            assert result == mock_jwks
            mock_get.assert_called_once_with(
                "https://test.logto.app/oidc/jwks",
                timeout=httpx.Timeout(5.0, read=5.0),
            )

        # Clear cache after test
        get_logto_jwks.cache_clear()

    def test_get_logto_jwks_http_error(self, mock_settings):
        """Test JWKS fetch failure with HTTP error."""
        get_logto_jwks.cache_clear()

        with patch("httpx.get") as mock_get:
            mock_get.side_effect = httpx.HTTPError("Network error")

            with pytest.raises(HTTPException) as exc_info:
                get_logto_jwks()

            assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert "Unable to fetch Logto signing keys" in exc_info.value.detail

        get_logto_jwks.cache_clear()

    def test_get_logto_jwks_malformed_response(self, mock_settings):
        """Test JWKS fetch with malformed response."""
        get_logto_jwks.cache_clear()

        with patch("httpx.get") as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = {"keys": []}  # Empty keys
            mock_get.return_value = mock_response

            with pytest.raises(HTTPException) as exc_info:
                get_logto_jwks()

            assert exc_info.value.status_code == status.HTTP_502_BAD_GATEWAY
            assert "Logto signing keys response malformed" in exc_info.value.detail

        get_logto_jwks.cache_clear()

    def test_get_logto_jwks_missing_keys(self, mock_settings):
        """Test JWKS fetch with missing keys field."""
        get_logto_jwks.cache_clear()

        with patch("httpx.get") as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = {}  # No keys field
            mock_get.return_value = mock_response

            with pytest.raises(HTTPException) as exc_info:
                get_logto_jwks()

            assert exc_info.value.status_code == status.HTTP_502_BAD_GATEWAY

        get_logto_jwks.cache_clear()


@pytest.mark.unit
class TestGetCurrentUser:
    """Unit tests for get_current_user dependency."""

    def test_get_current_user_with_valid_token(self, mock_settings, mock_jwks):
        """Test get_current_user with valid JWT token."""
        get_logto_jwks.cache_clear()

        # Create mock credentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="valid-token"
        )

        # Mock JWT validation
        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.return_value = {"sub": "test-user-123"}

            result = pytest.importorskip("asyncio").run(
                get_current_user(credentials)
            )

            assert result == "test-user-123"
            mock_decode.assert_called_once()

        get_logto_jwks.cache_clear()

    def test_get_current_user_with_invalid_token(self, mock_settings, mock_jwks):
        """Test get_current_user with invalid JWT token."""
        get_logto_jwks.cache_clear()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid-token"
        )

        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.side_effect = JWTError("Invalid signature")

            with pytest.raises(HTTPException) as exc_info:
                pytest.importorskip("asyncio").run(
                    get_current_user(credentials)
                )

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Invalid or expired token" in exc_info.value.detail

        get_logto_jwks.cache_clear()

    def test_get_current_user_with_expired_token(self, mock_settings, mock_jwks):
        """Test get_current_user with expired JWT token."""
        get_logto_jwks.cache_clear()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="expired-token"
        )

        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.side_effect = ExpiredSignatureError("Token expired")

            with pytest.raises(HTTPException) as exc_info:
                pytest.importorskip("asyncio").run(
                    get_current_user(credentials)
                )

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

        get_logto_jwks.cache_clear()

    def test_get_current_user_with_missing_sub_claim(self, mock_settings, mock_jwks):
        """Test get_current_user with missing sub claim."""
        get_logto_jwks.cache_clear()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="token-without-sub"
        )

        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
            patch("src.middleware.auth.jwt.decode") as mock_decode,
        ):
            mock_header.return_value = {"kid": "test-key-id"}
            mock_decode.return_value = {}  # No sub claim

            with pytest.raises(HTTPException) as exc_info:
                pytest.importorskip("asyncio").run(
                    get_current_user(credentials)
                )

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "missing user ID" in exc_info.value.detail

        get_logto_jwks.cache_clear()

    def test_get_current_user_with_missing_kid(self, mock_settings, mock_jwks):
        """Test get_current_user with missing kid in token header."""
        get_logto_jwks.cache_clear()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="token-without-kid"
        )

        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
        ):
            mock_header.return_value = {}  # No kid

            with pytest.raises(HTTPException) as exc_info:
                pytest.importorskip("asyncio").run(
                    get_current_user(credentials)
                )

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "missing key identifier" in exc_info.value.detail

        get_logto_jwks.cache_clear()

    def test_get_current_user_with_unknown_kid(self, mock_settings, mock_jwks):
        """Test get_current_user with kid not found in JWKS."""
        get_logto_jwks.cache_clear()

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="token-with-unknown-kid"
        )

        with (
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch("src.middleware.auth.jwt.get_unverified_header") as mock_header,
        ):
            mock_header.return_value = {"kid": "unknown-key-id"}

            with pytest.raises(HTTPException) as exc_info:
                pytest.importorskip("asyncio").run(
                    get_current_user(credentials)
                )

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "signing key not found" in exc_info.value.detail

        get_logto_jwks.cache_clear()
