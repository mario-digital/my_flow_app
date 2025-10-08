"""Logto JWT authentication middleware.

This module includes a lightweight, per-process JWKS cache to minimise calls to
Logto during token validation. For multi-worker deployments (e.g., Gunicorn or
Uvicorn with multiple workers), replace the in-memory cache with a shared cache
such as Redis to keep key material in sync across processes.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Mapping, MutableMapping, Sequence
from threading import RLock
from typing import TYPE_CHECKING, cast
from uuid import uuid4

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.config import settings

if TYPE_CHECKING:
    from src.models.context import ContextInDB
    from src.models.flow import FlowInDB
    from src.repositories.context_repository import ContextRepository
    from src.repositories.flow_repository import FlowRepository

# HTTPBearer security scheme for extracting Bearer tokens
security = HTTPBearer()
logger = logging.getLogger(__name__)


JWKSResponse = dict[str, object]
JWKSKey = Mapping[str, object]
JWTClaims = MutableMapping[str, object]

_JWKS_CACHE: JWKSResponse | None = None
_JWKS_CACHE_TS: float = 0.0
_JWKS_LOCK = RLock()
# NOTE: Cache is per-process; multi-worker deployments should use a shared cache (e.g., Redis).


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


def _fetch_jwks(request_id: str) -> JWKSResponse:
    """Fetch JWKS payload from Logto and return parsed JSON."""

    timeout_seconds = settings.LOGTO_JWKS_TIMEOUT_SECONDS
    try:
        response = httpx.get(
            f"{settings.LOGTO_ENDPOINT}/oidc/jwks",
            timeout=httpx.Timeout(timeout_seconds, read=timeout_seconds),
        )
        response.raise_for_status()
        jwks = cast(JWKSResponse, response.json())
    except httpx.HTTPError as exc:
        msg = "Unable to fetch Logto signing keys"
        raise _auth_error(
            msg,
            status.HTTP_503_SERVICE_UNAVAILABLE,
            request_id,
        ) from exc

    keys = jwks.get("keys")
    malformed_keys = (
        not isinstance(keys, list)
        or not keys
        or not all(isinstance(item, Mapping) for item in keys)
    )
    if malformed_keys:
        msg = "Logto signing keys response malformed"
        raise _auth_error(
            msg,
            status.HTTP_502_BAD_GATEWAY,
            request_id,
        )

    return jwks


def get_logto_jwks(request_id: str, *, force_refresh: bool = False) -> JWKSResponse:
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

    with _JWKS_LOCK:
        cached = _JWKS_CACHE
        cache_age = now - _JWKS_CACHE_TS
        cache_valid = cached is not None and (ttl < 0 or (ttl > 0 and cache_age < ttl))

        if cache_valid and not force_refresh and cached is not None:
            return cached

        jwks = _fetch_jwks(request_id)
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
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
        # Extract header first to fail fast if token lacks metadata
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            msg = "Invalid token: missing key identifier"
            raise _auth_error(
                msg,
                status.HTTP_401_UNAUTHORIZED,
                request_id,
            )

        jwks = get_logto_jwks(request_id)
        jwks_keys = cast(Sequence[JWKSKey], jwks["keys"])

        # Find the signing key that matches the token's kid
        signing_key = next((key for key in jwks_keys if key.get("kid") == kid), None)
        if not signing_key:
            jwks = get_logto_jwks(request_id, force_refresh=True)
            jwks_keys = cast(Sequence[JWKSKey], jwks["keys"])
            signing_key = next((key for key in jwks_keys if key.get("kid") == kid), None)
            if not signing_key:
                msg = "Invalid token: signing key not found"
                raise _auth_error(
                    msg,
                    status.HTTP_401_UNAUTHORIZED,
                    request_id,
                )

        # Decode and verify JWT using the matching signing key
        payload = cast(
            JWTClaims,
            jwt.decode(
                token,
                key=dict(signing_key),
                algorithms=["RS256"],
                audience=settings.LOGTO_APP_ID,
                issuer=f"{settings.LOGTO_ENDPOINT}/oidc",
            ),
        )

        if not _token_has_required_resource(payload):
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

        logger.info(
            "JWT validated",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "resource": payload.get("resource") or payload.get("resources"),
            },
        )

        return user_id

    except JWTError as exc:
        logger.info("JWT validation failed", exc_info=exc, extra={"request_id": request_id})
        msg = "Invalid or expired token"
        raise _auth_error(
            msg,
            status.HTTP_401_UNAUTHORIZED,
            request_id,
        ) from exc


def _token_has_required_resource(payload: Mapping[str, object]) -> bool:
    """Return True when payload includes configured resource claim.

    Logto tokens may expose the API audience via either a singular ``resource``
    claim or a plural ``resources`` claim (occasionally a list). We inspect both
    to avoid false negatives when Logto toggles claim formats.
    """

    expected_resource = settings.LOGTO_RESOURCE
    if not expected_resource:
        return True

    claim_values: list[str] = []
    resource_claim = payload.get("resource")
    resources_claim = payload.get("resources")

    if isinstance(resource_claim, str):
        claim_values.append(resource_claim)
    elif isinstance(resource_claim, list):
        claim_values.extend(str(item) for item in resource_claim if isinstance(item, str))

    if isinstance(resources_claim, str):
        claim_values.append(resources_claim)
    elif isinstance(resources_claim, list):
        claim_values.extend(str(item) for item in resources_claim if isinstance(item, str))

    return expected_resource in claim_values


# Authorization Helper Functions (DRY pattern for ownership verification)


async def verify_context_ownership(
    context_id: str,
    user_id: str,
    context_repo: ContextRepository,
) -> ContextInDB:
    """
    Verify user owns the context and return it.

    Args:
        context_id: Context ID to verify
        user_id: Current user ID from JWT
        context_repo: ContextRepository instance

    Returns:
        ContextInDB: The context if owned by user

    Raises:
        HTTPException: 404 if context not found or not owned by user
    """
    context = await context_repo.get_by_id(context_id, user_id)
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )
    return context


async def verify_flow_ownership(
    flow_id: str,
    user_id: str,
    flow_repo: FlowRepository,
) -> FlowInDB:
    """
    Verify user owns the flow and return it.

    Args:
        flow_id: Flow ID to verify
        user_id: Current user ID from JWT
        flow_repo: FlowRepository instance

    Returns:
        FlowInDB: The flow if owned by user

    Raises:
        HTTPException: 404 if flow not found, 403 if not owned by user
    """
    flow = await flow_repo.get_by_id(flow_id, user_id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found",
        )

    return flow
