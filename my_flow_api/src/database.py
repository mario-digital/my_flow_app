"""MongoDB database connection and utilities."""

from collections.abc import Mapping

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.config import settings


class MongoDB:
    """MongoDB connection container."""

    client: AsyncIOMotorClient[Mapping[str, object]] | None = None
    db: AsyncIOMotorDatabase[Mapping[str, object]] | None = None


db_instance = MongoDB()


async def connect_to_mongo() -> None:
    """Initialize MongoDB connection and create indexes."""
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]

    # Create indexes for performance
    await create_indexes()


async def close_mongo_connection() -> None:
    """Close MongoDB connection."""
    if db_instance.client:
        db_instance.client.close()


async def get_database() -> AsyncIOMotorDatabase[Mapping[str, object]]:
    """Dependency for accessing database in routes."""
    if db_instance.db is None:
        msg = "Database not initialized"
        raise RuntimeError(msg)
    return db_instance.db


async def create_indexes() -> None:
    """Create MongoDB indexes for performance."""
    if db_instance.db is None:
        return

    db = db_instance.db

    # Contexts collection indexes
    await db.contexts.create_index("user_id")
    await db.contexts.create_index([("user_id", 1), ("created_at", -1)])

    # Flows collection indexes
    await db.flows.create_index("context_id")
    await db.flows.create_index("user_id")
    await db.flows.create_index([("context_id", 1), ("is_completed", 1), ("priority", 1)])
    await db.flows.create_index([("context_id", 1), ("due_date", 1), ("is_completed", 1)])
    await db.flows.create_index([("user_id", 1), ("due_date", 1), ("is_completed", 1)])

    # UserPreferences collection indexes
    await db.user_preferences.create_index("user_id", unique=True)
