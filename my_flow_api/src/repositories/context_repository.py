"""
Context repository for CRUD operations on contexts collection.

Implements repository pattern for Context entities with user ownership checks.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.models.context import ContextCreate, ContextInDB, ContextUpdate
from src.repositories.base import BaseRepository


class ContextRepository(BaseRepository[ContextInDB]):
    """
    Repository for Context CRUD operations.

    All operations include user ownership checks for security.
    """

    def __init__(self, db: AsyncIOMotorDatabase) -> None:  # type: ignore[type-arg]
        """
        Initialize ContextRepository.

        Args:
            db: MongoDB database instance
        """
        super().__init__(db, "contexts", ContextInDB)

    async def create(  # type: ignore[override]
        self, user_id: str, context_data: ContextCreate
    ) -> ContextInDB:
        """
        Create new context with user ownership.

        Args:
            user_id: ID of user creating the context
            context_data: Context creation data

        Returns:
            Created context with ID and timestamps
        """
        data = context_data.model_dump()
        data["user_id"] = user_id
        return await super().create(data)

    async def get_by_id(self, context_id: str, user_id: str) -> ContextInDB | None:
        """
        Get context by ID with ownership check.

        Args:
            context_id: Context ID to retrieve
            user_id: ID of user requesting the context

        Returns:
            Context if found and owned by user, None otherwise
        """
        obj_id = self._to_object_id(context_id)
        if not obj_id:
            return None

        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return ContextInDB(**doc) if doc else None

    async def count_by_user(self, user_id: str) -> int:
        """
        Count total contexts for a user.

        Args:
            user_id: ID of user whose contexts to count

        Returns:
            Total count of contexts for user
        """
        return await self.collection.count_documents({"user_id": user_id})

    async def get_all_by_user(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> list[ContextInDB]:
        """
        Get all contexts for a user with pagination, sorted by created_at descending.

        Args:
            user_id: ID of user whose contexts to retrieve
            limit: Maximum number of contexts to return (default: 50)
            offset: Number of contexts to skip for pagination (default: 0)

        Returns:
            List of contexts sorted by most recent first
        """
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        cursor.skip(offset)
        cursor.limit(limit)
        docs = await cursor.to_list(length=limit)
        return [ContextInDB(**doc) for doc in docs]

    async def update(  # type: ignore[override]
        self,
        context_id: str,
        user_id: str,
        updates: ContextUpdate,
    ) -> ContextInDB | None:
        """
        Update context with ownership check.

        Only updates fields that are not None in the update model.

        Args:
            context_id: Context ID to update
            user_id: ID of user requesting the update
            updates: Fields to update

        Returns:
            Updated context or None if not found/unauthorized
        """
        obj_id = self._to_object_id(context_id)
        if not obj_id:
            return None

        # Only include non-None fields in update
        data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not data:
            # No fields to update, return current document
            return await self.get_by_id(context_id, user_id)

        data["updated_at"] = self._utc_now()

        result = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id},
            {"$set": data},
            return_document=True,
        )
        return ContextInDB(**result) if result else None

    async def delete(  # type: ignore[override]
        self, context_id: str, user_id: str
    ) -> bool:
        """
        Delete context with ownership check.

        Args:
            context_id: Context ID to delete
            user_id: ID of user requesting deletion

        Returns:
            True if deleted, False if not found/unauthorized
        """
        obj_id = self._to_object_id(context_id)
        if not obj_id:
            return False

        result = await self.collection.delete_one({"_id": obj_id, "user_id": user_id})
        return result.deleted_count > 0
