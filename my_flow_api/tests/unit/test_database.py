"""Unit tests for database module."""

from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.database import (
    MongoDB,
    close_mongo_connection,
    connect_to_mongo,
    create_indexes,
    db_instance,
    get_database,
)


@pytest.fixture
def mock_settings() -> MagicMock:
    """Mock settings for testing."""
    settings = MagicMock()
    settings.MONGODB_URI = "mongodb://localhost:27017"
    settings.MONGODB_DB_NAME = "test_db"
    return settings


@pytest.fixture
async def cleanup_db_instance() -> AsyncGenerator[None, None]:
    """Clean up db_instance after each test."""
    yield
    db_instance.client = None
    db_instance.db = None


@pytest.mark.asyncio
async def test_connect_to_mongo(mock_settings: MagicMock, cleanup_db_instance: None) -> None:
    """Test MongoDB connection initialization."""
    mock_client = MagicMock(spec=AsyncIOMotorClient)
    mock_db = MagicMock(spec=AsyncIOMotorDatabase)
    mock_client.__getitem__ = MagicMock(return_value=mock_db)

    with (
        patch("src.database.AsyncIOMotorClient", return_value=mock_client),
        patch("src.database.settings", mock_settings),
        patch("src.database.create_indexes", new_callable=AsyncMock) as mock_create_indexes,
    ):
        await connect_to_mongo()

        assert db_instance.client == mock_client
        assert db_instance.db == mock_db
        mock_create_indexes.assert_called_once()


@pytest.mark.asyncio
async def test_close_mongo_connection(cleanup_db_instance: None) -> None:
    """Test MongoDB connection closure."""
    mock_client = MagicMock()
    db_instance.client = mock_client

    await close_mongo_connection()

    mock_client.close.assert_called_once()


@pytest.mark.asyncio
async def test_close_mongo_connection_no_client(cleanup_db_instance: None) -> None:
    """Test closing connection when no client exists."""
    db_instance.client = None

    # Should not raise an error
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_get_database_returns_db_instance(cleanup_db_instance: None) -> None:
    """Test get_database dependency returns database instance."""
    mock_db = MagicMock(spec=AsyncIOMotorDatabase)
    db_instance.db = mock_db

    db = await get_database()

    assert db == mock_db


@pytest.mark.asyncio
async def test_get_database_raises_when_not_initialized(cleanup_db_instance: None) -> None:
    """Test get_database raises error when database not initialized."""
    db_instance.db = None

    with pytest.raises(RuntimeError, match="Database not initialized"):
        await get_database()


@pytest.mark.asyncio
async def test_create_indexes(cleanup_db_instance: None) -> None:
    """Test index creation for all collections."""
    mock_db = MagicMock(spec=AsyncIOMotorDatabase)
    mock_contexts = MagicMock()
    mock_flows = MagicMock()
    mock_user_prefs = MagicMock()
    mock_conversations = MagicMock()

    mock_db.contexts = mock_contexts
    mock_db.flows = mock_flows
    mock_db.user_preferences = mock_user_prefs
    mock_db.conversations = mock_conversations

    # Mock create_index as async
    mock_contexts.create_index = AsyncMock()
    mock_flows.create_index = AsyncMock()
    mock_user_prefs.create_index = AsyncMock()
    mock_conversations.create_index = AsyncMock()

    db_instance.db = mock_db

    await create_indexes()

    # Verify contexts indexes
    assert mock_contexts.create_index.call_count == 2
    mock_contexts.create_index.assert_any_call("user_id")
    mock_contexts.create_index.assert_any_call([("user_id", 1), ("created_at", -1)])

    # Verify flows indexes
    assert mock_flows.create_index.call_count == 5
    mock_flows.create_index.assert_any_call("context_id")
    mock_flows.create_index.assert_any_call("user_id")
    mock_flows.create_index.assert_any_call(
        [("context_id", 1), ("is_completed", 1), ("priority", 1)]
    )
    mock_flows.create_index.assert_any_call(
        [("context_id", 1), ("due_date", 1), ("is_completed", 1)]
    )
    mock_flows.create_index.assert_any_call(
        [("user_id", 1), ("due_date", 1), ("is_completed", 1)]
    )

    # Verify user_preferences indexes
    mock_user_prefs.create_index.assert_called_once_with("user_id", unique=True)

    # Verify conversations indexes
    assert mock_conversations.create_index.call_count == 5
    mock_conversations.create_index.assert_any_call("user_id")
    mock_conversations.create_index.assert_any_call("context_id")
    mock_conversations.create_index.assert_any_call([("user_id", 1), ("context_id", 1)])
    mock_conversations.create_index.assert_any_call([("context_id", 1), ("updated_at", -1)])
    mock_conversations.create_index.assert_any_call([("user_id", 1), ("_id", 1)])


@pytest.mark.asyncio
async def test_create_indexes_no_db(cleanup_db_instance: None) -> None:
    """Test create_indexes does nothing when db is None."""
    db_instance.db = None

    # Should not raise an error
    await create_indexes()


def test_mongodb_class_initialization() -> None:
    """Test MongoDB class can be instantiated."""
    mongo = MongoDB()
    assert mongo.client is None
    assert mongo.db is None
