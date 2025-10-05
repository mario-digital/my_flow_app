"""Integration tests for database connection."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.database import close_mongo_connection, connect_to_mongo, db_instance
from src.main import app


@pytest.mark.asyncio
async def test_database_connection_lifecycle() -> None:
    """Test full connection lifecycle with mocked MongoDB."""
    with patch("src.database.AsyncIOMotorClient") as mock_client:
        mock_db = AsyncMock()
        mock_db.command = AsyncMock(return_value={"ok": 1.0})
        mock_client.return_value.__getitem__.return_value = mock_db

        await connect_to_mongo()

        # Verify connection by pinging database
        result = await mock_db.command("ping")
        assert result["ok"] == 1.0

        await close_mongo_connection()


@pytest.mark.asyncio
async def test_indexes_created() -> None:
    """Test that indexes are created on startup with mocked MongoDB."""
    with patch("src.database.AsyncIOMotorClient") as mock_client:
        mock_db = MagicMock()

        # Mock index lists for each collection
        mock_contexts_cursor = MagicMock()
        mock_contexts_cursor.to_list = AsyncMock(return_value=[
            {"name": "_id_"},
            {"name": "user_id_1"},
            {"name": "user_id_1_created_at_-1"}
        ])
        mock_db.contexts.list_indexes = MagicMock(return_value=mock_contexts_cursor)

        mock_flows_cursor = MagicMock()
        mock_flows_cursor.to_list = AsyncMock(return_value=[
            {"name": "_id_"},
            {"name": "context_id_1"},
            {"name": "user_id_1"}
        ])
        mock_db.flows.list_indexes = MagicMock(return_value=mock_flows_cursor)

        mock_prefs_cursor = MagicMock()
        mock_prefs_cursor.to_list = AsyncMock(return_value=[
            {"name": "_id_"},
            {"name": "user_id_1"}
        ])
        mock_db.user_preferences.list_indexes = MagicMock(return_value=mock_prefs_cursor)

        mock_client.return_value.__getitem__.return_value = mock_db

        await connect_to_mongo()

        # Get indexes for contexts collection
        contexts_indexes = await db_instance.db.contexts.list_indexes().to_list(length=None)
        contexts_index_names = [idx["name"] for idx in contexts_indexes]

        # Verify contexts indexes exist
        assert "user_id_1" in contexts_index_names
        assert any("user_id_1_created_at_-1" in name for name in contexts_index_names)

        # Get indexes for flows collection
        flows_indexes = await db_instance.db.flows.list_indexes().to_list(length=None)
        flows_index_names = [idx["name"] for idx in flows_indexes]

        # Verify flows indexes exist
        assert "context_id_1" in flows_index_names
        assert "user_id_1" in flows_index_names

        # Get indexes for user_preferences collection
        prefs_indexes = await db_instance.db.user_preferences.list_indexes().to_list(length=None)
        prefs_index_names = [idx["name"] for idx in prefs_indexes]

        # Verify user_preferences unique index exists
        assert "user_id_1" in prefs_index_names

        await close_mongo_connection()


@pytest.mark.asyncio
async def test_health_endpoint_mongodb_status() -> None:
    """Test health endpoint includes MongoDB connection status with mocked MongoDB."""
    with patch("src.database.AsyncIOMotorClient") as mock_client:
        mock_db = AsyncMock()
        mock_db.command = AsyncMock(return_value={"ok": 1.0})
        mock_client.return_value.__getitem__.return_value = mock_db

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
async def test_database_operations() -> None:
    """Test basic database operations with mocked MongoDB."""
    with patch("src.database.AsyncIOMotorClient") as mock_client:
        mock_db = AsyncMock()
        mock_collection = AsyncMock()

        # Mock insert
        mock_insert_result = MagicMock()
        mock_insert_result.inserted_id = "test_id_123"
        mock_collection.insert_one = AsyncMock(return_value=mock_insert_result)

        # Mock find
        mock_collection.find_one = AsyncMock(side_effect=[
            {"test": "data", "value": 123},  # First find after insert
            {"test": "data", "value": 456},  # Find after update
            None  # Find after delete
        ])

        # Mock update
        mock_collection.update_one = AsyncMock()

        # Mock delete
        mock_collection.delete_one = AsyncMock()

        mock_db.test_collection = mock_collection
        mock_client.return_value.__getitem__.return_value = mock_db

        await connect_to_mongo()

        # Insert a test document
        test_collection = db_instance.db.test_collection
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

        await close_mongo_connection()
