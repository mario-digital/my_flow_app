"""User Preferences API routes."""

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, Request

from src.dependencies import get_user_preferences_repository
from src.middleware.auth import get_current_user
from src.models.errors import RateLimitError
from src.models.user_preferences import (
    UserPreferencesInDB,
    UserPreferencesUpdate,
)
from src.rate_limit import limiter

if TYPE_CHECKING:
    from src.repositories.user_preferences_repository import UserPreferencesRepository

router = APIRouter(prefix="/api/v1/preferences", tags=["User Preferences"])

RATE_LIMIT_RESPONSE: dict[int | str, dict[str, Any]] = {
    429: {
        "model": RateLimitError,
        "description": "Rate limit exceeded",
        "headers": {
            "Retry-After": {
                "description": "Seconds until rate limit resets",
                "schema": {"type": "integer"},
            }
        },
    }
}


@router.get("", response_model=UserPreferencesInDB, responses=RATE_LIMIT_RESPONSE)
@limiter.limit("60/minute")
async def get_preferences(
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    prefs_repo: "UserPreferencesRepository" = Depends(get_user_preferences_repository),
) -> UserPreferencesInDB:
    """
    Get user preferences, creating defaults if none exist.

    Returns the user's preferences document with all settings.
    """
    return await prefs_repo.get_or_create(user_id)


@router.put("", response_model=UserPreferencesInDB, responses=RATE_LIMIT_RESPONSE)
@limiter.limit("30/minute")
async def update_preferences(
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    updates: UserPreferencesUpdate,
    user_id: str = Depends(get_current_user),
    prefs_repo: "UserPreferencesRepository" = Depends(get_user_preferences_repository),
) -> UserPreferencesInDB:
    """
    Update user preferences.

    Only provided fields will be updated. Omitted fields remain unchanged.
    Creates default preferences if none exist.
    """
    return await prefs_repo.update_preferences(user_id, updates)
