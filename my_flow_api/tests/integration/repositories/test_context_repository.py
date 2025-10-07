"""Integration tests for ContextRepository."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId

from src.models.context import ContextCreate, ContextUpdate


@pytest.mark.asyncio
async def test_create_context_success(context_repository, mock_collection, cleanup_contexts):
    """Test creating a context with user_id and timestamps."""
    # Arrange
    user_id = "test_user_123"
    context_data = ContextCreate(
        name="Work",
        color="#3B82F6",
        icon="💼",
    )

    # Mock MongoDB responses
    inserted_id = ObjectId()
    mock_collection.insert_one.return_value = MagicMock(inserted_id=inserted_id)
    now = datetime.now(UTC)
    mock_collection.find_one.return_value = {
        "_id": inserted_id,  # MongoDB returns ObjectId
        "user_id": user_id,
        "name": "Work",
        "color": "#3B82F6",
        "icon": "💼",
        "created_at": now,
        "updated_at": now,
    }

    # Act
    result = await context_repository.create(user_id, context_data)

    # Assert
    assert result.id is not None
    assert result.user_id == user_id
    assert result.name == "Work"
    assert result.color == "#3B82F6"
    assert result.icon == "💼"
    assert result.created_at is not None
    assert result.updated_at is not None
    assert result.created_at == result.updated_at


@pytest.mark.asyncio
async def test_get_by_id_success(context_repository, mock_collection, cleanup_contexts):
    """Test retrieving a context by ID with ownership check."""
    # Arrange
    user_id = "test_user_123"
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    mock_collection.find_one.return_value = {
        "_id": ObjectId(context_id),
        "user_id": user_id,
        "name": "Work",
        "color": "#3B82F6",
        "icon": "💼",
        "created_at": now,
        "updated_at": now,
    }

    # Act
    result = await context_repository.get_by_id(context_id, user_id)

    # Assert
    assert result is not None
    assert result.id == context_id
    assert result.user_id == user_id
    assert result.name == "Work"


@pytest.mark.asyncio
async def test_get_by_id_not_found(context_repository, mock_collection, cleanup_contexts):
    """Test get_by_id returns None for non-existent context."""
    # Arrange
    mock_collection.find_one.return_value = None

    # Act
    result = await context_repository.get_by_id(
        "507f1f77bcf86cd799439011", "test_user_123"
    )

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_get_by_id_invalid_id(context_repository, mock_collection, cleanup_contexts):
    """Test get_by_id returns None for invalid ObjectId format."""
    # Act
    result = await context_repository.get_by_id("invalid_id", "test_user_123")

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_get_all_by_user_success(context_repository, mock_collection, cleanup_contexts):
    """Test retrieving all contexts for a user sorted by created_at desc."""
    # Arrange
    user_id = "test_user_123"
    now = datetime.now(UTC)

    # Mock cursor to return list of documents
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "name": "Personal",
            "color": "#10B981",
            "icon": "🏠",
            "created_at": now,
            "updated_at": now,
        },
    ])
    mock_collection.find.return_value = mock_cursor

    # Act
    result = await context_repository.get_all_by_user(user_id)

    # Assert
    assert len(result) == 2
    assert result[0].name == "Work"
    assert result[1].name == "Personal"


@pytest.mark.asyncio
async def test_get_all_by_user_empty(context_repository, mock_collection, cleanup_contexts):
    """Test get_all_by_user returns empty list for user with no contexts."""
    # Arrange
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_collection.find.return_value = mock_cursor

    # Act
    result = await context_repository.get_all_by_user("user_with_no_contexts")

    # Assert
    assert result == []


@pytest.mark.asyncio
async def test_update_context_success(context_repository, mock_collection, cleanup_contexts):
    """Test updating context fields and updated_at timestamp."""
    # Arrange
    user_id = "test_user_123"
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    mock_collection.find_one_and_update.return_value = {
        "_id": ObjectId(context_id),
        "user_id": user_id,
        "name": "Updated Work",
        "color": "#EF4444",
        "icon": "💼",
        "created_at": now,
        "updated_at": now,
    }

    # Act
    updates = ContextUpdate(name="Updated Work", color="#EF4444")
    result = await context_repository.update(context_id, user_id, updates)

    # Assert
    assert result is not None
    assert result.id == context_id
    assert result.name == "Updated Work"
    assert result.color == "#EF4444"


@pytest.mark.asyncio
async def test_update_context_not_found(context_repository, mock_collection, cleanup_contexts):
    """Test update returns None when context not found."""
    # Arrange
    mock_collection.find_one_and_update.return_value = None

    # Act
    updates = ContextUpdate(name="Updated")
    result = await context_repository.update(
        "507f1f77bcf86cd799439011", "test_user_123", updates
    )

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_update_context_invalid_id(context_repository, mock_collection, cleanup_contexts):
    """Test update returns None for invalid ObjectId format."""
    # Act
    updates = ContextUpdate(name="Updated")
    result = await context_repository.update(
        "invalid_id", "test_user_123", updates
    )

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_delete_context_success(context_repository, mock_collection, cleanup_contexts):
    """Test deleting a context returns True."""
    # Arrange
    context_id = str(ObjectId())
    mock_collection.delete_one.return_value = MagicMock(deleted_count=1)

    # Act
    result = await context_repository.delete(context_id, "test_user_123")

    # Assert
    assert result is True


@pytest.mark.asyncio
async def test_delete_context_not_found(context_repository, mock_collection, cleanup_contexts):
    """Test delete returns False when context not found."""
    # Arrange
    mock_collection.delete_one.return_value = MagicMock(deleted_count=0)

    # Act
    result = await context_repository.delete(
        "507f1f77bcf86cd799439011", "test_user_123"
    )

    # Assert
    assert result is False


@pytest.mark.asyncio
async def test_delete_context_invalid_id(context_repository, mock_collection, cleanup_contexts):
    """Test delete returns False for invalid ObjectId format."""
    # Act
    result = await context_repository.delete("invalid_id", "test_user_123")

    # Assert
    assert result is False
