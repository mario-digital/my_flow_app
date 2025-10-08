"""Rate limiting utilities using slowapi."""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return standardized response when rate limits are exceeded."""
    if not isinstance(exc, RateLimitExceeded):  # pragma: no cover - defensive guard
        raise exc

    if hasattr(request, "state"):
        request.state.rate_limit_path = str(request.url.path)

    retry_after = int(getattr(exc, "retry_after", 0) or 0)

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": retry_after,
        },
        headers={"Retry-After": str(retry_after)},
    )


__all__ = ["RateLimitExceeded", "limiter", "rate_limit_exceeded_handler"]
