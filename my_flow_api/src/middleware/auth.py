"""Logto JWT authentication middleware."""

from functools import lru_cache
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.config import settings

# HTTPBearer security scheme for extracting Bearer tokens
security = HTTPBearer()


@lru_cache(maxsize=1)
def get_logto_jwks() -> dict[str, Any]:
    """
    Fetch and cache Logto JWKS (public keys).

    Returns:
        dict: JWKS response containing public keys

    Raises:
        HTTPException: 503 if unable to fetch keys, 502 if response is malformed
    """
    try:
        response = httpx.get(
            f"{settings.LOGTO_ENDPOINT}/oidc/jwks",
            timeout=httpx.Timeout(5.0, read=5.0),
        )
        response.raise_for_status()
        jwks = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch Logto signing keys",
        ) from exc

    keys = jwks.get("keys")
    if not isinstance(keys, list) or not keys:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Logto signing keys response malformed",
        )

    return jwks


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),  # noqa: B008
) -> str:
    """
    Validate Logto JWT token and extract user_id.

    Args:
        credentials: HTTP Bearer token credentials

    Returns:
        str: User ID from token sub claim

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing required claims
    """
    token = credentials.credentials

    try:
        # Get unverified header to find the correct signing key
        jwks = get_logto_jwks()
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing key identifier",
            )

        # Find the signing key that matches the token's kid
        signing_key = next(
            (key for key in jwks["keys"] if key.get("kid") == kid),
            None,
        )
        if not signing_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: signing key not found",
            )

        # Decode and verify JWT using the matching signing key
        payload = jwt.decode(
            token,
            key=signing_key,
            algorithms=["RS256"],
            audience=settings.LOGTO_APP_ID,
            issuer=f"{settings.LOGTO_ENDPOINT}/oidc",
        )

        # Extract user_id from sub claim
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        return user_id

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e!s}",
        ) from e
