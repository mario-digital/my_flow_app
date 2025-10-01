"""MongoDB database connection and utilities."""

from collections.abc import Mapping

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.config import settings

# Database client (will be initialized in later stories)
MongoDocument = Mapping[str, object]
client: AsyncIOMotorClient[MongoDocument] | None = None
db: AsyncIOMotorDatabase[MongoDocument] | None = None


async def connect_to_mongo() -> None:
    """Establish connection to MongoDB."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]


async def close_mongo_connection() -> None:
    """Close MongoDB connection."""
    if client:
        client.close()
