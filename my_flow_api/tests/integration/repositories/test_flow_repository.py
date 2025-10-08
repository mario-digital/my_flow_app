"""Integration tests for FlowRepository."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId

from src.models.flow import FlowCreate, FlowPriority, FlowUpdate
from src.repositories.context_repository import ContextRepository
from src.repositories.flow_repository import FlowRepository


@pytest.fixture
def mock_flow_collection():
    """Create a mock MongoDB collection for flows with common operations."""
    collection = MagicMock()

    # Set up async mock methods with proper return values
    collection.insert_one = AsyncMock()
    collection.find_one = AsyncMock(return_value=None)  # Default to None
    collection.find_one_and_update = AsyncMock(return_value=None)
    collection.delete_one = AsyncMock()
    collection.delete_many = AsyncMock()

    # Mock find() to return a cursor-like object
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    collection.find = MagicMock(return_value=mock_cursor)

    return collection


@pytest.fixture
def test_flow_db(mock_flow_collection):
    """Provide mock test database for flows."""
    mock_db = MagicMock()
    mock_db.__getitem__ = MagicMock(return_value=mock_flow_collection)
    return mock_db


@pytest.fixture
def mock_context_repo():
    """Provide mock ContextRepository for validation."""
    repo = MagicMock(spec=ContextRepository)
    repo.get_by_id = AsyncMock(return_value=None)  # Default to None
    return repo


@pytest.fixture
def flow_repository(test_flow_db, mock_context_repo):
    """Provide FlowRepository instance with mock database and context repo."""
    return FlowRepository(test_flow_db, mock_context_repo)


@pytest.fixture
def cleanup_flows():
    """Placeholder cleanup fixture for consistency."""
    return


# ============================================================================
# CREATE TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_create_flow_success(
    flow_repository, mock_flow_collection, mock_context_repo, cleanup_flows
):
    """Test creating a flow with context validation."""
    # Arrange
    user_id = "test_user_123"
    context_id = str(ObjectId())
    flow_data = FlowCreate(
        context_id=context_id,
        title="Complete project documentation",
        description="Write comprehensive API docs",
        priority=FlowPriority.HIGH,
    )

    # Mock context validation - context exists
    mock_context_repo.get_by_id.return_value = MagicMock(id=context_id)

    # Mock MongoDB responses
    inserted_id = ObjectId()
    mock_flow_collection.insert_one.return_value = MagicMock(inserted_id=inserted_id)
    now = datetime.now(UTC)
    mock_flow_collection.find_one.return_value = {
        "_id": inserted_id,
        "context_id": context_id,
        "user_id": user_id,
        "title": "Complete project documentation",
        "description": "Write comprehensive API docs",
        "priority": "high",
        "is_completed": False,
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }

    # Act
    result = await flow_repository.create(user_id, context_id, flow_data)

    # Assert
    assert result is not None
    assert result.id is not None
    assert result.context_id == context_id
    assert result.user_id == user_id
    assert result.title == "Complete project documentation"
    assert result.priority == FlowPriority.HIGH
    assert result.is_completed is False
    assert result.created_at is not None
    assert result.updated_at is not None
    mock_context_repo.get_by_id.assert_called_once_with(context_id, user_id)


@pytest.mark.asyncio
async def test_create_flow_context_not_found(
    flow_repository, mock_context_repo, cleanup_flows
):
    """Test create returns None when context doesn't exist (validation failure)."""
    # Arrange
    user_id = "test_user_123"
    context_id = "nonexistent_context"
    flow_data = FlowCreate(
        context_id=context_id,
        title="Test Flow",
        priority=FlowPriority.MEDIUM,
    )

    # Mock context validation - context not found
    mock_context_repo.get_by_id.return_value = None

    # Act
    result = await flow_repository.create(user_id, context_id, flow_data)

    # Assert
    assert result is None
    mock_context_repo.get_by_id.assert_called_once_with(context_id, user_id)


# ============================================================================
# GET BY ID TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_get_by_id_success(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test retrieving a flow by ID with ownership check."""
    # Arrange
    user_id = "test_user_123"
    flow_id = str(ObjectId())
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    mock_flow_collection.find_one.return_value = {
        "_id": ObjectId(flow_id),
        "context_id": context_id,
        "user_id": user_id,
        "title": "Test Flow",
        "description": None,
        "priority": "medium",
        "is_completed": False,
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }

    # Act
    result = await flow_repository.get_by_id(flow_id, user_id)

    # Assert
    assert result is not None
    assert result.id == flow_id
    assert result.user_id == user_id
    assert result.title == "Test Flow"


@pytest.mark.asyncio
async def test_get_by_id_not_found(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test get_by_id returns None for non-existent flow."""
    # Arrange
    mock_flow_collection.find_one.return_value = None

    # Act
    result = await flow_repository.get_by_id(str(ObjectId()), "test_user_123")

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_get_by_id_invalid_id(flow_repository, cleanup_flows):
    """Test get_by_id returns None for invalid ObjectId format."""
    # Act
    result = await flow_repository.get_by_id("invalid_id", "test_user_123")

    # Assert
    assert result is None


# ============================================================================
# GET ALL BY CONTEXT TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_get_all_by_context_success(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test retrieving all flows for a context sorted by created_at desc."""
    # Arrange
    user_id = "test_user_123"
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    # Mock cursor to return flow list
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": ObjectId(),
            "context_id": context_id,
            "user_id": user_id,
            "title": "Flow 1",
            "description": None,
            "priority": "high",
            "is_completed": False,
            "due_date": None,
            "reminder_enabled": True,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        },
        {
            "_id": ObjectId(),
            "context_id": context_id,
            "user_id": user_id,
            "title": "Flow 2",
            "description": None,
            "priority": "medium",
            "is_completed": False,
            "due_date": None,
            "reminder_enabled": True,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        },
    ])
    mock_flow_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    result = await flow_repository.get_all_by_context(context_id, user_id)

    # Assert
    assert len(result) == 2
    assert result[0].title == "Flow 1"
    assert result[1].title == "Flow 2"
    mock_cursor.sort.assert_called_once_with("created_at", -1)


@pytest.mark.asyncio
async def test_get_all_by_context_filters_completed(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test get_all_by_context filters completed flows when include_completed=False."""
    # Arrange
    user_id = "test_user_123"
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    # Mock cursor to return only non-completed flows
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": ObjectId(),
            "context_id": context_id,
            "user_id": user_id,
            "title": "Active Flow",
            "description": None,
            "priority": "medium",
            "is_completed": False,
            "due_date": None,
            "reminder_enabled": True,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        },
    ])
    mock_flow_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    result = await flow_repository.get_all_by_context(
        context_id, user_id, include_completed=False
    )

    # Assert
    assert len(result) == 1
    assert result[0].is_completed is False
    # Verify query includes is_completed filter
    call_args = mock_flow_collection.find.call_args[0][0]
    assert call_args["is_completed"] is False


@pytest.mark.asyncio
async def test_get_all_by_context_includes_completed(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test get_all_by_context includes completed flows when include_completed=True."""
    # Arrange
    user_id = "test_user_123"
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    # Mock cursor to return all flows
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": ObjectId(),
            "context_id": context_id,
            "user_id": user_id,
            "title": "Active Flow",
            "description": None,
            "priority": "medium",
            "is_completed": False,
            "due_date": None,
            "reminder_enabled": True,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        },
        {
            "_id": ObjectId(),
            "context_id": context_id,
            "user_id": user_id,
            "title": "Completed Flow",
            "description": None,
            "priority": "high",
            "is_completed": True,
            "due_date": None,
            "reminder_enabled": True,
            "created_at": now,
            "updated_at": now,
            "completed_at": now,
        },
    ])
    mock_flow_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    result = await flow_repository.get_all_by_context(
        context_id, user_id, include_completed=True
    )

    # Assert
    assert len(result) == 2
    # Verify query does NOT include is_completed filter
    call_args = mock_flow_collection.find.call_args[0][0]
    assert "is_completed" not in call_args


@pytest.mark.asyncio
async def test_get_all_by_context_empty_result(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test get_all_by_context returns empty list for context with no flows."""
    # Arrange
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_flow_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    result = await flow_repository.get_all_by_context(
        str(ObjectId()), "test_user_123"
    )

    # Assert
    assert result == []


# ============================================================================
# UPDATE TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_update_flow_success(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test updating flow fields and updated_at timestamp."""
    # Arrange
    user_id = "test_user_123"
    flow_id = str(ObjectId())
    context_id = str(ObjectId())
    now = datetime.now(UTC)
    updates = FlowUpdate(
        title="Updated Title",
        priority=FlowPriority.HIGH,
    )

    mock_flow_collection.find_one_and_update.return_value = {
        "_id": ObjectId(flow_id),
        "context_id": context_id,
        "user_id": user_id,
        "title": "Updated Title",
        "description": None,
        "priority": "high",
        "is_completed": False,
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }

    # Act
    result = await flow_repository.update(flow_id, user_id, updates)

    # Assert
    assert result is not None
    assert result.title == "Updated Title"
    assert result.priority == FlowPriority.HIGH


@pytest.mark.asyncio
async def test_update_flow_partial(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test partial update only updates provided fields."""
    # Arrange
    user_id = "test_user_123"
    flow_id = str(ObjectId())
    context_id = str(ObjectId())
    now = datetime.now(UTC)
    updates = FlowUpdate(title="New Title")  # Only title provided

    mock_flow_collection.find_one_and_update.return_value = {
        "_id": ObjectId(flow_id),
        "context_id": context_id,
        "user_id": user_id,
        "title": "New Title",
        "description": "Original description",
        "priority": "medium",
        "is_completed": False,
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }

    # Act
    result = await flow_repository.update(flow_id, user_id, updates)

    # Assert
    assert result is not None
    assert result.title == "New Title"
    # Verify only title was in update data
    call_args = mock_flow_collection.find_one_and_update.call_args[0]
    update_data = call_args[1]["$set"]
    assert "title" in update_data
    assert "updated_at" in update_data
    assert "priority" not in update_data  # Not provided in updates


@pytest.mark.asyncio
async def test_update_flow_not_found(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test update returns None when flow not found."""
    # Arrange
    mock_flow_collection.find_one_and_update.return_value = None
    updates = FlowUpdate(title="Updated Title")

    # Act
    result = await flow_repository.update(str(ObjectId()), "test_user_123", updates)

    # Assert
    assert result is None


# ============================================================================
# DELETE TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_delete_flow_success(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test deleting flow returns True."""
    # Arrange
    mock_delete_result = MagicMock()
    mock_delete_result.deleted_count = 1
    mock_flow_collection.delete_one.return_value = mock_delete_result

    # Act
    result = await flow_repository.delete(str(ObjectId()), "test_user_123")

    # Assert
    assert result is True


@pytest.mark.asyncio
async def test_delete_flow_not_found(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test delete returns False when flow not found."""
    # Arrange
    mock_delete_result = MagicMock()
    mock_delete_result.deleted_count = 0
    mock_flow_collection.delete_one.return_value = mock_delete_result

    # Act
    result = await flow_repository.delete(str(ObjectId()), "test_user_123")

    # Assert
    assert result is False


# ============================================================================
# MARK COMPLETE TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_mark_complete_success(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test marking flow as completed sets is_completed=True and completed_at timestamp."""
    # Arrange
    user_id = "test_user_123"
    flow_id = str(ObjectId())
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    # Mock get_by_id to return non-completed flow
    mock_flow_collection.find_one.return_value = {
        "_id": ObjectId(flow_id),
        "context_id": context_id,
        "user_id": user_id,
        "title": "Test Flow",
        "description": None,
        "priority": "medium",
        "is_completed": False,
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }

    # Mock find_one_and_update to return completed flow
    completed_time = datetime.now(UTC)
    mock_flow_collection.find_one_and_update.return_value = {
        "_id": ObjectId(flow_id),
        "context_id": context_id,
        "user_id": user_id,
        "title": "Test Flow",
        "description": None,
        "priority": "medium",
        "is_completed": True,
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": completed_time,
        "completed_at": completed_time,
    }

    # Act
    result = await flow_repository.mark_complete(flow_id, user_id)

    # Assert
    assert result is not None
    assert result.is_completed is True
    assert result.completed_at is not None


@pytest.mark.asyncio
async def test_mark_complete_already_completed(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test mark_complete returns None when flow already completed (idempotent)."""
    # Arrange
    user_id = "test_user_123"
    flow_id = str(ObjectId())
    context_id = str(ObjectId())
    now = datetime.now(UTC)

    # Mock get_by_id to return already completed flow
    mock_flow_collection.find_one.return_value = {
        "_id": ObjectId(flow_id),
        "context_id": context_id,
        "user_id": user_id,
        "title": "Test Flow",
        "description": None,
        "priority": "medium",
        "is_completed": True,  # Already completed
        "due_date": None,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now,
        "completed_at": now,
    }

    # Act
    result = await flow_repository.mark_complete(flow_id, user_id)

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_mark_complete_not_found(
    flow_repository, mock_flow_collection, cleanup_flows
):
    """Test mark_complete returns None when flow not found."""
    # Arrange
    mock_flow_collection.find_one.return_value = None

    # Act
    result = await flow_repository.mark_complete(str(ObjectId()), "test_user_123")

    # Assert
    assert result is None
