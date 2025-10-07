"""
Base repository pattern for MongoDB CRUD operations.

Provides generic CRUD methods for all repository implementations.
"""

from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel


class BaseRepository[ModelType: BaseModel]:
    """
    Generic base repository with common CRUD operations.

    Provides reusable async CRUD methods for MongoDB collections.
    Subclasses should specify the collection name and model type.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,  # type: ignore[type-arg]
        collection_name: str,
        model: type[ModelType],
    ) -> None:
        """
        Initialize base repository.

        Args:
            db: MongoDB database instance
            collection_name: Name of MongoDB collection
            model: Pydantic model class for type conversion
        """
        self.collection = db[collection_name]
        self.model = model

    def _to_object_id(self, doc_id: str) -> ObjectId | None:
        """
        Convert string ID to MongoDB ObjectId.

        Args:
            doc_id: String representation of ObjectId

        Returns:
            ObjectId instance or None if invalid
        """
        try:
            return ObjectId(doc_id)
        except (InvalidId, TypeError):
            return None

    def _utc_now(self) -> datetime:
        """Get current UTC timestamp with timezone info."""
        return datetime.now(UTC)

    async def find_by_id(self, doc_id: str) -> ModelType | None:
        """
        Find document by ID.

        Args:
            doc_id: Document ID as string

        Returns:
            Model instance or None if not found
        """
        obj_id = self._to_object_id(doc_id)
        if not obj_id:
            return None

        doc = await self.collection.find_one({"_id": obj_id})
        return self.model(**doc) if doc else None

    async def create(self, data: dict[str, object]) -> ModelType:
        """
        Insert new document with timestamps.

        Args:
            data: Document data as dictionary

        Returns:
            Created model instance with ID
        """
        now = self._utc_now()
        data["created_at"] = now
        data["updated_at"] = now

        result = await self.collection.insert_one(data)
        doc = await self.collection.find_one({"_id": result.inserted_id})
        if doc is None:
            msg = f"Failed to retrieve created document with ID {result.inserted_id}"
            raise RuntimeError(msg)
        return self.model(**doc)

    async def update(self, doc_id: str, data: dict[str, object]) -> ModelType | None:
        """
        Update document by ID.

        Args:
            doc_id: Document ID as string
            data: Fields to update

        Returns:
            Updated model instance or None if not found
        """
        obj_id = self._to_object_id(doc_id)
        if not obj_id:
            return None

        data["updated_at"] = self._utc_now()

        result = await self.collection.find_one_and_update(
            {"_id": obj_id},
            {"$set": data},
            return_document=True,  # Pydantic v2 pattern
        )
        return self.model(**result) if result else None

    async def delete(self, doc_id: str) -> bool:
        """
        Delete document by ID.

        Args:
            doc_id: Document ID as string

        Returns:
            True if deleted, False if not found
        """
        obj_id = self._to_object_id(doc_id)
        if not obj_id:
            return False

        result = await self.collection.delete_one({"_id": obj_id})
        return result.deleted_count > 0
