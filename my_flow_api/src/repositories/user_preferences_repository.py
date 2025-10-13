"""
User Preferences repository for CRUD operations on user_preferences collection.

Implements repository pattern for UserPreferences entities.
Each user has exactly one preferences document.
"""

from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.models.user_preferences import (
    UserPreferencesCreate,
    UserPreferencesInDB,
    UserPreferencesUpdate,
)
from src.repositories.base import BaseRepository


class UserPreferencesRepository(BaseRepository[UserPreferencesInDB]):
    """
    Repository for User Preferences CRUD operations.

    Each user has exactly one preferences document. Get or create pattern is used.
    """

    def __init__(self, db: AsyncIOMotorDatabase) -> None:  # type: ignore[type-arg]
        """
        Initialize UserPreferencesRepository.

        Args:
            db: MongoDB database instance
        """
        super().__init__(db, "user_preferences", UserPreferencesInDB)

    async def get_or_create(self, user_id: str) -> UserPreferencesInDB:
        """
        Get user preferences, creating default if not exists.

        Args:
            user_id: ID of user whose preferences to retrieve

        Returns:
            User preferences document
        """
        # Try to find existing preferences
        doc = await self.collection.find_one({"user_id": user_id})

        if doc:
            return UserPreferencesInDB(**doc)

        # Create default preferences if none exist
        default_prefs = UserPreferencesCreate()
        data = default_prefs.model_dump()
        data["user_id"] = user_id
        return await super().create(data)

    async def update_preferences(
        self, user_id: str, updates: UserPreferencesUpdate
    ) -> UserPreferencesInDB:
        """
        Update user preferences, creating if not exists.

        Args:
            user_id: ID of user whose preferences to update
            updates: Preference updates to apply

        Returns:
            Updated preferences document
        """
        # Ensure preferences exist
        existing = await self.get_or_create(user_id)

        # Apply updates (only non-None fields)
        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}

        if not update_data:
            return existing

        # Update in database using base repository method
        updated = await self.update(existing.id, update_data)
        if not updated:
            msg = "Preferences document not found after update"
            raise ValueError(msg)

        return updated

    async def mark_onboarding_complete(self, user_id: str) -> UserPreferencesInDB:
        """
        Mark onboarding as completed for a user.

        Args:
            user_id: ID of user who completed onboarding

        Returns:
            Updated preferences document
        """

        updates = UserPreferencesUpdate(
            onboarding_completed=True,
            onboarding_completed_at=datetime.now(UTC),
        )
        return await self.update_preferences(user_id, updates)

    async def set_current_context(
        self, user_id: str, context_id: str | None
    ) -> UserPreferencesInDB:
        """
        Set the user's current active context.

        Args:
            user_id: ID of user
            context_id: ID of context to set as current, or None to clear

        Returns:
            Updated preferences document
        """
        updates = UserPreferencesUpdate(current_context_id=context_id)
        return await self.update_preferences(user_id, updates)
