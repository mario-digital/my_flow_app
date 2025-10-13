"""Shared FastAPI dependency factories."""

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.database import get_database
from src.repositories.context_repository import ContextRepository
from src.repositories.flow_repository import FlowRepository
from src.repositories.user_preferences_repository import UserPreferencesRepository


async def get_context_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> ContextRepository:
    """Return a ContextRepository bound to the current database."""
    return ContextRepository(db)


async def get_flow_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> FlowRepository:
    """Return a FlowRepository bound to the current database."""
    context_repo = ContextRepository(db)
    return FlowRepository(db, context_repo)


async def get_user_preferences_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> UserPreferencesRepository:
    """Return a UserPreferencesRepository bound to the current database."""
    return UserPreferencesRepository(db)


__all__ = [
    "get_context_repository",
    "get_flow_repository",
    "get_user_preferences_repository",
]
