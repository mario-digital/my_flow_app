"""Integration tests for database connection."""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.database import close_mongo_connection, connect_to_mongo, db_instance
from src.main import app


@pytest.fixture(scope="module")
async def test_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Fixture for test database connection."""
    await connect_to_mongo()
    if db_instance.db is None:
        msg = "Database not initialized"
        raise RuntimeError(msg)
    yield db_instance.db
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_database_connection_lifecycle(test_db: AsyncIOMotorDatabase) -> None:
    """Test full connection lifecycle."""
    # Verify connection by pinging database
    result = await test_db.command("ping")
    assert result["ok"] == 1.0


@pytest.mark.asyncio
async def test_indexes_created(test_db: AsyncIOMotorDatabase) -> None:
    """Test that indexes are created on startup."""
    # Get indexes for contexts collection
    contexts_indexes = await test_db.contexts.list_indexes().to_list(length=None)
    contexts_index_names = [idx["name"] for idx in contexts_indexes]

    # Verify contexts indexes exist
    assert "user_id_1" in contexts_index_names
    assert any("user_id_1_created_at_-1" in name for name in contexts_index_names)

    # Get indexes for flows collection
    flows_indexes = await test_db.flows.list_indexes().to_list(length=None)
    flows_index_names = [idx["name"] for idx in flows_indexes]

    # Verify flows indexes exist
    assert "context_id_1" in flows_index_names
    assert "user_id_1" in flows_index_names

    # Get indexes for user_preferences collection
    prefs_indexes = await test_db.user_preferences.list_indexes().to_list(length=None)
    prefs_index_names = [idx["name"] for idx in prefs_indexes]

    # Verify user_preferences unique index exists
    assert "user_id_1" in prefs_index_names


@pytest.mark.asyncio
async def test_health_endpoint_mongodb_status() -> None:
    """Test health endpoint includes MongoDB connection status."""
    # Connect to database first
    await connect_to_mongo()

    try:
        transport = ASGITransport(app=app)  # type: ignore[arg-type]
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "mongodb_connected" in data
        assert "timestamp" in data

        # Should be healthy when connected
        assert data["status"] == "healthy"
        assert data["mongodb_connected"] is True
    finally:
        await close_mongo_connection()


@pytest.mark.asyncio
async def test_database_operations(test_db: AsyncIOMotorDatabase) -> None:
    """Test basic database operations."""
    # Insert a test document
    test_collection = test_db.test_collection
    result = await test_collection.insert_one({"test": "data", "value": 123})
    assert result.inserted_id is not None

    # Find the document
    doc = await test_collection.find_one({"test": "data"})
    assert doc is not None
    assert doc["value"] == 123

    # Update the document
    await test_collection.update_one({"test": "data"}, {"$set": {"value": 456}})
    updated_doc = await test_collection.find_one({"test": "data"})
    assert updated_doc is not None
    assert updated_doc["value"] == 456

    # Delete the document
    await test_collection.delete_one({"test": "data"})
    deleted_doc = await test_collection.find_one({"test": "data"})
    assert deleted_doc is None
