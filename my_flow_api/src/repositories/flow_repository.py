"""
Flow repository for CRUD operations on flows collection.

Implements repository pattern for Flow entities with context validation.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase

from src.models.flow import FlowCreate, FlowInDB, FlowUpdate
from src.repositories.base import BaseRepository
from src.repositories.context_repository import ContextRepository


class FlowRepository(BaseRepository[FlowInDB]):
    """
    Repository for Flow CRUD operations.

    All operations include context validation and user ownership checks.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,  # type: ignore[type-arg]
        context_repo: ContextRepository,
    ) -> None:
        """
        Initialize FlowRepository.

        Args:
            db: MongoDB database instance
            context_repo: Context repository for validation
        """
        super().__init__(db, "flows", FlowInDB)
        self.context_repo = context_repo

    async def create(  # type: ignore[override]
        self, user_id: str, context_id: str, flow_data: FlowCreate
    ) -> FlowInDB | None:
        """
        Create new flow with context validation.

        Validates that the context exists and belongs to the user before
        creating the flow.

        Args:
            user_id: ID of user creating the flow
            context_id: ID of context to associate flow with
            flow_data: Flow creation data

        Returns:
            Created flow with ID and timestamps, or None if context not found
            or user doesn't own the context (validation failure)
        """
        # Verify context exists and user owns it
        context = await self.context_repo.get_by_id(context_id, user_id)
        if not context:
            return None

        data = flow_data.model_dump()
        data["context_id"] = context_id
        data["user_id"] = user_id
        data["is_completed"] = False
        return await super().create(data)

    async def get_by_id(
        self, flow_id: str, user_id: str
    ) -> FlowInDB | None:
        """
        Get flow by ID with ownership check.

        Args:
            flow_id: Flow ID to retrieve
            user_id: ID of user requesting the flow

        Returns:
            Flow if found and owned by user, None if not found or unauthorized
        """
        obj_id = self._to_object_id(flow_id)
        if not obj_id:
            return None

        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})
        return FlowInDB(**doc) if doc else None

    async def count_by_context(
        self, context_id: str, include_completed: bool = False
    ) -> int:
        """
        Count total flows for a context.

        Args:
            context_id: ID of context whose flows to count
            include_completed: If False, exclude completed flows from count

        Returns:
            Total count of flows for context
        """
        query: dict[str, object] = {"context_id": context_id}
        if not include_completed:
            query["is_completed"] = False

        return await self.collection.count_documents(query)

    async def get_all_by_context(
        self,
        context_id: str,
        user_id: str,
        include_completed: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[FlowInDB]:
        """
        Get all flows for a context with pagination, optionally filtering completed flows.

        Flows are sorted by created_at descending (most recent first).

        Args:
            context_id: ID of context whose flows to retrieve
            user_id: ID of user requesting the flows
            include_completed: If False, exclude completed flows from results
            limit: Maximum number of flows to return (default: 50)
            offset: Number of flows to skip for pagination (default: 0)

        Returns:
            List of flows sorted by most recent first
        """
        query: dict[str, object] = {"context_id": context_id, "user_id": user_id}
        if not include_completed:
            query["is_completed"] = False

        cursor = self.collection.find(query).sort("created_at", -1)
        cursor.skip(offset)
        cursor.limit(limit)
        docs = await cursor.to_list(length=limit)
        return [FlowInDB(**doc) for doc in docs]

    async def delete_by_context_id(self, context_id: str, user_id: str) -> int:
        """
        Delete all flows for a context in bulk (cascade delete support).

        Args:
            context_id: Context ID whose flows to delete
            user_id: User ID for ownership verification

        Returns:
            int: Number of flows deleted

        Note: This method performs a single delete_many() query instead of
        fetching flows and deleting one-by-one (avoids N+1 problem).
        """
        # Verify user owns the context (security check)
        context = await self.context_repo.get_by_id(context_id, user_id)
        if not context:
            return 0  # Context not found or user doesn't own it

        # Bulk delete all flows for this context
        result = await self.collection.delete_many({"context_id": context_id})
        return result.deleted_count

    async def update(  # type: ignore[override]
        self,
        flow_id: str,
        user_id: str,
        updates: FlowUpdate,
    ) -> FlowInDB | None:
        """
        Update flow with ownership check.

        Only updates fields that are not None in the update model.
        Always updates the updated_at timestamp.

        Args:
            flow_id: Flow ID to update
            user_id: ID of user requesting the update
            updates: Fields to update

        Returns:
            Updated flow or None if not found or unauthorized
        """
        obj_id = self._to_object_id(flow_id)
        if not obj_id:
            return None

        # Only include non-None fields in update (partial update pattern)
        data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not data:
            # No fields to update, return current document
            return await self.get_by_id(flow_id, user_id)

        data["updated_at"] = self._utc_now()

        result = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id},
            {"$set": data},
            return_document=True,
        )
        return FlowInDB(**result) if result else None

    async def delete(  # type: ignore[override]
        self, flow_id: str, user_id: str
    ) -> bool:
        """
        Delete flow with ownership check.

        Args:
            flow_id: Flow ID to delete
            user_id: ID of user requesting deletion

        Returns:
            True if deleted, False if not found or unauthorized
        """
        obj_id = self._to_object_id(flow_id)
        if not obj_id:
            return False

        result = await self.collection.delete_one(
            {"_id": obj_id, "user_id": user_id}
        )
        return result.deleted_count > 0

    async def mark_complete(
        self, flow_id: str, user_id: str
    ) -> FlowInDB | None:
        """
        Mark flow as completed with timestamp.

        Idempotent operation - returns None if flow is already completed.

        Args:
            flow_id: Flow ID to mark as complete
            user_id: ID of user requesting the completion

        Returns:
            Updated flow with completion timestamp, or None if not found,
            unauthorized, or already completed (idempotent behavior)
        """
        # Check current status
        flow = await self.get_by_id(flow_id, user_id)
        if not flow or flow.is_completed:
            return None  # Already completed or not found

        obj_id = self._to_object_id(flow_id)
        if not obj_id:
            return None

        result = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id},
            {
                "$set": {
                    "is_completed": True,
                    "completed_at": self._utc_now(),
                    "updated_at": self._utc_now(),
                }
            },
            return_document=True,
        )
        return FlowInDB(**result) if result else None
