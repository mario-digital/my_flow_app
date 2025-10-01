"""Unit tests for Logto JWT authentication middleware."""

from unittest.mock import Mock, patch

import httpx
import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError

from src.middleware.auth import clear_jwks_cache, get_current_user, get_logto_jwks


@pytest.fixture(autouse=True)
def reset_cache() -> None:
    """Ensure JWKS cache is cleared before each test."""
    clear_jwks_cache()
    yield
    clear_jwks_cache()


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
        mock.LOGTO_APP_SECRET = "test-secret"
        mock.LOGTO_RESOURCE = None
        mock.LOGTO_JWKS_TIMEOUT_SECONDS = 5.0
        mock.LOGTO_JWKS_CACHE_TTL_SECONDS = 3600.0
        yield mock


@pytest.mark.unit
class TestGetLogtoJwks:
    """Unit tests for get_logto_jwks function."""

    def test_get_logto_jwks_success(self, mock_settings, mock_jwks):
        """Test successful JWKS fetch and caching."""
        with patch("httpx.get") as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = mock_jwks
            mock_get.return_value = mock_response

            result = get_logto_jwks("req-123")

            assert result == mock_jwks
            mock_get.assert_called_once_with(
                "https://test.logto.app/oidc/jwks",
                timeout=httpx.Timeout(5.0, read=5.0),
            )

    def test_get_logto_jwks_http_error(self, mock_settings):
        """Test JWKS fetch failure with HTTP error."""
        with patch("httpx.get", side_effect=httpx.HTTPError("Network error")):
            with pytest.raises(HTTPException) as exc_info:
                get_logto_jwks("req-124")

            assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert exc_info.value.detail["message"] == "Unable to fetch Logto signing keys"
            assert exc_info.value.detail["request_id"] == "req-124"

    def test_get_logto_jwks_malformed_response(self, mock_settings):
        """Test JWKS fetch with malformed response."""
        mock_response = Mock()
        mock_response.json.return_value = {"keys": []}
        with patch("httpx.get", return_value=mock_response):
            with pytest.raises(HTTPException) as exc_info:
                get_logto_jwks("req-125")

            assert exc_info.value.status_code == status.HTTP_502_BAD_GATEWAY
            assert exc_info.value.detail["message"] == "Logto signing keys response malformed"
            assert exc_info.value.detail["request_id"] == "req-125"

    def test_get_logto_jwks_force_refresh(self, mock_settings, mock_jwks):
        """Test JWKS fetch with force refresh bypasses cache."""
        mock_response = Mock()
        mock_response.json.return_value = mock_jwks
        with patch("httpx.get", return_value=mock_response) as mock_get:
            # First call populates cache
            get_logto_jwks("req-126")
            # Second call with force_refresh should hit network again
            get_logto_jwks("req-126", force_refresh=True)

            assert mock_get.call_count == 2


@pytest.mark.unit
class TestGetCurrentUser:
    """Unit tests for get_current_user dependency."""

    @pytest.fixture
    def credentials(self) -> HTTPAuthorizationCredentials:
        """Return HTTP bearer credentials for tests."""
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    @pytest.mark.asyncio
    async def test_get_current_user_with_valid_token(self, mock_settings, mock_jwks, credentials):
        """Test get_current_user with valid JWT token."""
        request_mock = Mock()
        with (
            patch("src.middleware.auth._extract_request_id", return_value="req-200"),
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch(
                "src.middleware.auth.jwt.get_unverified_header",
                return_value={"kid": "test-key-id"},
            ),
            patch("src.middleware.auth.jwt.decode", return_value={"sub": "test-user-123"}),
        ):
            result = await get_current_user(request_mock, credentials)

            assert result == "test-user-123"

    @pytest.mark.asyncio
    async def test_get_current_user_validates_resource(self, mock_settings, mock_jwks, credentials):
        """Tokens must include configured resource claim."""
        mock_settings.LOGTO_RESOURCE = "api://my-resource"
        request_mock = Mock()
        with (
            patch("src.middleware.auth._extract_request_id", return_value="req-201"),
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch(
                "src.middleware.auth.jwt.get_unverified_header",
                return_value={"kid": "test-key-id"},
            ),
            patch(
                "src.middleware.auth.jwt.decode",
                return_value={"sub": "user", "resource": "wrong-resource"},
            ),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(request_mock, credentials)

            expected_msg = "Invalid token: missing required resource claim"
            assert exc_info.value.detail["message"] == expected_msg
            assert exc_info.value.detail["request_id"] == "req-201"

    @pytest.mark.asyncio
    async def test_get_current_user_refreshes_keys_when_kid_unknown(
        self, mock_settings, mock_jwks, credentials
    ):
        """When kid is missing initially, middleware refreshes JWKS."""
        request_mock = Mock()
        refreshed_keys = {"keys": [{"kid": "new-key"}]}
        with (
            patch("src.middleware.auth._extract_request_id", return_value="req-202"),
            patch(
                "src.middleware.auth.get_logto_jwks",
                side_effect=[mock_jwks, refreshed_keys],
            ) as mock_jwks_fn,
            patch("src.middleware.auth.jwt.get_unverified_header", return_value={"kid": "new-key"}),
            patch(
                "src.middleware.auth.jwt.decode",
                return_value={"sub": "user"},
            ),
        ):
            result = await get_current_user(request_mock, credentials)

            assert result == "user"
            assert mock_jwks_fn.call_count == 2

    @pytest.mark.asyncio
    async def test_get_current_user_with_missing_user_id(
        self, mock_settings, mock_jwks, credentials
    ) -> None:
        """Missing sub claim results in 401 with request context."""
        request_mock = Mock()
        with (
            patch("src.middleware.auth._extract_request_id", return_value="req-203"),
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch(
                "src.middleware.auth.jwt.get_unverified_header",
                return_value={"kid": "test-key-id"},
            ),
            patch("src.middleware.auth.jwt.decode", return_value={}),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(request_mock, credentials)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert exc_info.value.detail["request_id"] == "req-203"

    @pytest.mark.asyncio
    async def test_get_current_user_with_jwt_error(self, mock_settings, mock_jwks, credentials):
        """JWT errors propagate as 401 with request ID for observability."""
        request_mock = Mock()
        with (
            patch("src.middleware.auth._extract_request_id", return_value="req-204"),
            patch("src.middleware.auth.get_logto_jwks", return_value=mock_jwks),
            patch(
                "src.middleware.auth.jwt.get_unverified_header",
                return_value={"kid": "test-key-id"},
            ),
            patch("src.middleware.auth.jwt.decode", side_effect=JWTError("boom")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(request_mock, credentials)

            assert exc_info.value.detail["request_id"] == "req-204"
            assert exc_info.value.detail["message"] == "Invalid or expired token"

    @pytest.mark.asyncio
    async def test_get_current_user_missing_kid_fails_fast(
        self, mock_settings, mock_jwks, credentials
    ) -> None:
        """Missing kid should fail before performing JWKS lookup."""
        request_mock = Mock()
        with (
            patch("src.middleware.auth._extract_request_id", return_value="req-205"),
            patch("src.middleware.auth.jwt.get_unverified_header", return_value={}),
            patch("src.middleware.auth.get_logto_jwks") as mock_jwks_fn,
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(request_mock, credentials)

            assert exc_info.value.detail["message"] == "Invalid token: missing key identifier"
            assert exc_info.value.detail["request_id"] == "req-205"
            mock_jwks_fn.assert_not_called()
