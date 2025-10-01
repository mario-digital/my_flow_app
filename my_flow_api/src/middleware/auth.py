"""Logto JWT authentication middleware."""

from __future__ import annotations

import time
from threading import RLock
from typing import Any
from uuid import uuid4

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.config import settings

# HTTPBearer security scheme for extracting Bearer tokens
security = HTTPBearer()


_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_CACHE_TS: float = 0.0
_JWKS_LOCK = RLock()


def _auth_error(message: str, status_code: int, request_id: str) -> HTTPException:
    """Create consistent HTTPException payloads with request context."""

    return HTTPException(
        status_code=status_code,
        detail={"message": message, "request_id": request_id},
    )


def _extract_request_id(request: Request) -> str:
    """Return request identifier from headers/state or create one."""

    header_request_id = request.headers.get("x-request-id")
    if header_request_id:
        return header_request_id

    state_request_id = getattr(request.state, "request_id", None)
    if isinstance(state_request_id, str) and state_request_id:
        return state_request_id

    generated = str(uuid4())
    request.state.request_id = generated
    return generated


def _fetch_jwks(request_id: str) -> dict[str, Any]:
    """Fetch JWKS payload from Logto and return parsed JSON."""

    timeout_seconds = settings.LOGTO_JWKS_TIMEOUT_SECONDS
    try:
        response = httpx.get(
            f"{settings.LOGTO_ENDPOINT}/oidc/jwks",
            timeout=httpx.Timeout(timeout_seconds, read=timeout_seconds),
        )
        response.raise_for_status()
        jwks = response.json()
    except httpx.HTTPError as exc:
        msg = "Unable to fetch Logto signing keys"
        raise _auth_error(
            msg,
            status.HTTP_503_SERVICE_UNAVAILABLE,
            request_id,
        ) from exc

    keys = jwks.get("keys")
    if not isinstance(keys, list) or not keys:
        msg = "Logto signing keys response malformed"
        raise _auth_error(
            msg,
            status.HTTP_502_BAD_GATEWAY,
            request_id,
        )

    return jwks


def get_logto_jwks(request_id: str, *, force_refresh: bool = False) -> dict[str, Any]:
    """
    Fetch and cache Logto JWKS (public keys).

    Returns:
        dict: JWKS response containing public keys

    Raises:
        HTTPException: 503 if unable to fetch keys, 502 if response is malformed
    """
    global _JWKS_CACHE, _JWKS_CACHE_TS

    ttl = settings.LOGTO_JWKS_CACHE_TTL_SECONDS
    now = time.monotonic()

    if not force_refresh:
        with _JWKS_LOCK:
            use_cache = False
            if _JWKS_CACHE is not None and (ttl < 0 or (ttl > 0 and now - _JWKS_CACHE_TS < ttl)):
                use_cache = True
            if use_cache:
                return _JWKS_CACHE

    jwks = _fetch_jwks(request_id)

    with _JWKS_LOCK:
        _JWKS_CACHE = jwks
        _JWKS_CACHE_TS = time.monotonic()

    return jwks


def clear_jwks_cache() -> None:
    """Utility for tests to clear JWKS cache state."""

    with _JWKS_LOCK:
        global _JWKS_CACHE, _JWKS_CACHE_TS
        _JWKS_CACHE = None
        _JWKS_CACHE_TS = 0.0


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),  # noqa: B008
) -> str:
    """
    Validate Logto JWT token and extract user_id.

    Args:
        credentials: HTTP Bearer token credentials
        request: FastAPI request object for context

    Returns:
        str: User ID from token sub claim

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing required claims
    """
    token = credentials.credentials

    request_id = _extract_request_id(request)

    try:
        # Get unverified header to find the correct signing key
        jwks = get_logto_jwks(request_id)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            msg = "Invalid token: missing key identifier"
            raise _auth_error(
                msg,
                status.HTTP_401_UNAUTHORIZED,
                request_id,
            )

        # Find the signing key that matches the token's kid
        signing_key = next(
            (key for key in jwks["keys"] if key.get("kid") == kid),
            None,
        )
        if not signing_key:
            jwks = get_logto_jwks(request_id, force_refresh=True)
            signing_key = next(
                (key for key in jwks["keys"] if key.get("kid") == kid),
                None,
            )
            if not signing_key:
                msg = "Invalid token: signing key not found"
                raise _auth_error(
                    msg,
                    status.HTTP_401_UNAUTHORIZED,
                    request_id,
                )

        # Decode and verify JWT using the matching signing key
        payload = jwt.decode(
            token,
            key=signing_key,
            algorithms=["RS256"],
            audience=settings.LOGTO_APP_ID,
            issuer=f"{settings.LOGTO_ENDPOINT}/oidc",
        )

        if settings.LOGTO_RESOURCE:
            resource_claim = payload.get("resource")
            resources_claim = payload.get("resources")

            resource_matches = False
            if isinstance(resource_claim, str):
                resource_matches = resource_claim == settings.LOGTO_RESOURCE
            elif isinstance(resource_claim, list):
                resource_matches = settings.LOGTO_RESOURCE in resource_claim
            elif isinstance(resources_claim, (list, str)):
                if isinstance(resources_claim, str):
                    resource_matches = resources_claim == settings.LOGTO_RESOURCE
                else:
                    resource_matches = settings.LOGTO_RESOURCE in resources_claim

            if not resource_matches:
                msg = "Invalid token: missing required resource claim"
                raise _auth_error(
                    msg,
                    status.HTTP_401_UNAUTHORIZED,
                    request_id,
                )

        # Extract user_id from sub claim
        user_id = payload.get("sub")
        if not user_id or not isinstance(user_id, str):
            msg = "Invalid token: missing user ID"
            raise _auth_error(
                msg,
                status.HTTP_401_UNAUTHORIZED,
                request_id,
            )

        return user_id

    except JWTError as e:
        msg = f"Invalid or expired token: {e!s}"
        raise _auth_error(
            msg,
            status.HTTP_401_UNAUTHORIZED,
            request_id,
        ) from e
