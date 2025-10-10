"""Integration tests for ConversationRepository with mocked MongoDB."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId
from pydantic import ValidationError

from src.models.conversation import Message, MessageRole
from src.repositories.conversation_repository import ConversationRepository


@pytest.fixture
def conversation_repository(test_db):
    """Provide ConversationRepository instance with mock database."""
    return ConversationRepository(test_db)


@pytest.fixture
def sample_user_id():
    """Sample user ID for testing."""
    return "user123"


@pytest.fixture
def other_user_id():
    """Different user ID for testing isolation."""
    return "user456"


@pytest.fixture
def sample_context_id():
    """Sample context ID for testing."""
    return "context123"


@pytest.fixture
def sample_conversation_id():
    """Sample conversation ID for testing."""
    return str(ObjectId())


@pytest.fixture
def sample_message():
    """Sample message for testing."""
    return Message(
        role=MessageRole.USER,
        content="Hello, this is a test message",
        timestamp=datetime.now(UTC),
    )


# Task 8: Conversation Creation Tests


@pytest.mark.asyncio
async def test_create_conversation_success(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test successful conversation creation with empty messages."""
    # Arrange
    inserted_id = ObjectId()
    mock_collection.insert_one.return_value = MagicMock(inserted_id=inserted_id)
    mock_collection.find_one.return_value = {
        "_id": inserted_id,
        "context_id": sample_context_id,
        "user_id": sample_user_id,
        "messages": [],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    conversation = await conversation_repository.create_conversation(
        sample_context_id, sample_user_id
    )

    # Assert
    assert conversation.context_id == sample_context_id
    assert conversation.user_id == sample_user_id
    assert conversation.messages == []
    assert conversation.id == str(inserted_id)
    mock_collection.insert_one.assert_called_once()


@pytest.mark.asyncio
async def test_create_conversation_has_timestamps(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test that created conversation has created_at and updated_at timestamps."""
    # Arrange
    inserted_id = ObjectId()
    now = datetime.now(UTC)
    mock_collection.insert_one.return_value = MagicMock(inserted_id=inserted_id)
    mock_collection.find_one.return_value = {
        "_id": inserted_id,
        "context_id": sample_context_id,
        "user_id": sample_user_id,
        "messages": [],
        "created_at": now,
        "updated_at": now,
    }

    # Act
    conversation = await conversation_repository.create_conversation(
        sample_context_id, sample_user_id
    )

    # Assert
    assert conversation.created_at is not None
    assert conversation.updated_at is not None
    assert isinstance(conversation.created_at, datetime)
    assert isinstance(conversation.updated_at, datetime)


@pytest.mark.asyncio
async def test_create_conversation_links_to_context(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test that conversation is correctly linked to context."""
    # Arrange
    inserted_id = ObjectId()
    mock_collection.insert_one.return_value = MagicMock(inserted_id=inserted_id)
    mock_collection.find_one.return_value = {
        "_id": inserted_id,
        "context_id": sample_context_id,
        "user_id": sample_user_id,
        "messages": [],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    conversation = await conversation_repository.create_conversation(
        sample_context_id, sample_user_id
    )

    # Assert
    assert conversation.context_id == sample_context_id
    call_args = mock_collection.insert_one.call_args[0][0]
    assert call_args["context_id"] == sample_context_id


# Task 9: Message Operations Tests


@pytest.mark.asyncio
async def test_append_message_to_conversation(
    conversation_repository,
    mock_collection,
    sample_conversation_id,
    sample_user_id,
    sample_message,
):
    """Test appending a message to conversation with correct user_id."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    mock_collection.find_one_and_update.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [sample_message.model_dump()],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    conversation = await conversation_repository.append_message(
        sample_conversation_id, sample_message, sample_user_id
    )

    # Assert
    assert len(conversation.messages) == 1
    assert conversation.messages[0].content == sample_message.content
    assert conversation.messages[0].role == sample_message.role
    mock_collection.find_one_and_update.assert_called_once()


@pytest.mark.asyncio
async def test_append_multiple_messages(
    conversation_repository,
    mock_collection,
    sample_conversation_id,
    sample_user_id,
):
    """Test appending multiple messages and verifying order."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    messages = [
        Message(role=MessageRole.USER, content="Message 1", timestamp=datetime.now(UTC)),
        Message(
            role=MessageRole.ASSISTANT, content="Message 2", timestamp=datetime.now(UTC)
        ),
        Message(role=MessageRole.USER, content="Message 3", timestamp=datetime.now(UTC)),
    ]

    # Mock returns conversation with all messages
    mock_collection.find_one_and_update.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [msg.model_dump() for msg in messages],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    conversation = await conversation_repository.append_message(
        sample_conversation_id, messages[-1], sample_user_id
    )

    # Assert
    assert len(conversation.messages) == 3
    assert conversation.messages[0].content == "Message 1"
    assert conversation.messages[1].content == "Message 2"
    assert conversation.messages[2].content == "Message 3"


@pytest.mark.asyncio
async def test_append_message_updates_timestamp(
    conversation_repository,
    mock_collection,
    sample_conversation_id,
    sample_user_id,
    sample_message,
):
    """Test that updated_at changes after appending message."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    old_time = datetime(2025, 1, 1, 0, 0, 0, tzinfo=UTC)
    new_time = datetime.now(UTC)

    mock_collection.find_one_and_update.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [sample_message.model_dump()],
        "created_at": old_time,
        "updated_at": new_time,
    }

    # Act
    conversation = await conversation_repository.append_message(
        sample_conversation_id, sample_message, sample_user_id
    )

    # Assert
    assert conversation.updated_at > old_time
    # Verify $set was called with updated_at
    call_args = mock_collection.find_one_and_update.call_args[0][1]
    assert "$set" in call_args
    assert "updated_at" in call_args["$set"]


@pytest.mark.asyncio
async def test_append_message_to_nonexistent_conversation(
    conversation_repository,
    mock_collection,
    sample_conversation_id,
    sample_user_id,
    sample_message,
):
    """Test appending to non-existent conversation raises ValueError."""
    # Arrange
    mock_collection.find_one_and_update.return_value = None

    # Act & Assert
    with pytest.raises(ValueError, match="Conversation not found or unauthorized"):
        await conversation_repository.append_message(
            sample_conversation_id, sample_message, sample_user_id
        )


@pytest.mark.asyncio
async def test_append_message_unauthorized_user(
    conversation_repository,
    mock_collection,
    sample_conversation_id,
    other_user_id,
    sample_message,
):
    """Test appending with wrong user_id raises ValueError (security test)."""
    # Arrange
    mock_collection.find_one_and_update.return_value = None  # Unauthorized

    # Act & Assert
    with pytest.raises(ValueError, match="Conversation not found or unauthorized"):
        await conversation_repository.append_message(
            sample_conversation_id, sample_message, other_user_id
        )


@pytest.mark.asyncio
async def test_append_message_does_not_mutate_input(
    conversation_repository,
    mock_collection,
    sample_conversation_id,
    sample_user_id,
):
    """Test that input Message object is unchanged after append (security test)."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    original_message = Message(
        role=MessageRole.USER, content="Original message", timestamp=None
    )
    original_content = original_message.content
    original_timestamp = original_message.timestamp

    mock_collection.find_one_and_update.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [
            {
                "role": "user",
                "content": "Original message",
                "timestamp": datetime.now(UTC),
            }
        ],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    await conversation_repository.append_message(
        sample_conversation_id, original_message, sample_user_id
    )

    # Assert - original message should be unchanged
    assert original_message.content == original_content
    assert original_message.timestamp == original_timestamp


@pytest.mark.asyncio
async def test_get_recent_messages(
    conversation_repository, mock_collection, sample_conversation_id, sample_user_id
):
    """Test retrieving last 20 messages from conversation with 25 messages."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    all_messages = [
        Message(
            role=MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT,
            content=f"Message {i}",
            timestamp=datetime.now(UTC),
        )
        for i in range(25)
    ]

    mock_collection.find_one.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [msg.model_dump() for msg in all_messages],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    recent_messages = await conversation_repository.get_recent_messages(
        sample_conversation_id, sample_user_id, limit=20
    )

    # Assert
    assert len(recent_messages) == 20
    assert recent_messages[0].content == "Message 5"  # Last 20 start at index 5
    assert recent_messages[-1].content == "Message 24"  # Last message


@pytest.mark.asyncio
async def test_get_recent_messages_respects_limit(
    conversation_repository, mock_collection, sample_conversation_id, sample_user_id
):
    """Test custom limit parameter for recent messages."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    all_messages = [
        Message(
            role=MessageRole.USER,
            content=f"Message {i}",
            timestamp=datetime.now(UTC),
        )
        for i in range(10)
    ]

    mock_collection.find_one.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [msg.model_dump() for msg in all_messages],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    recent_messages = await conversation_repository.get_recent_messages(
        sample_conversation_id, sample_user_id, limit=5
    )

    # Assert
    assert len(recent_messages) == 5
    assert recent_messages[0].content == "Message 5"
    assert recent_messages[-1].content == "Message 9"


# Task 10: Retrieval Operations and User Isolation Tests


@pytest.mark.asyncio
async def test_get_conversation_by_id(
    conversation_repository, mock_collection, sample_conversation_id, sample_user_id
):
    """Test fetching conversation by ID with correct user_id."""
    # Arrange
    obj_id = ObjectId(sample_conversation_id)
    mock_collection.find_one.return_value = {
        "_id": obj_id,
        "context_id": "context123",
        "user_id": sample_user_id,
        "messages": [],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }

    # Act
    conversation = await conversation_repository.get_conversation_by_id(
        sample_conversation_id, sample_user_id
    )

    # Assert
    assert conversation is not None
    assert conversation.id == sample_conversation_id
    assert conversation.user_id == sample_user_id
    mock_collection.find_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_conversation_by_id_not_found(
    conversation_repository, mock_collection, sample_conversation_id, sample_user_id
):
    """Test fetching non-existent conversation returns None."""
    # Arrange
    mock_collection.find_one.return_value = None

    # Act
    conversation = await conversation_repository.get_conversation_by_id(
        sample_conversation_id, sample_user_id
    )

    # Assert
    assert conversation is None


@pytest.mark.asyncio
async def test_get_conversation_by_id_wrong_user(
    conversation_repository, mock_collection, sample_conversation_id, other_user_id
):
    """Test fetching with wrong user_id returns None (security test)."""
    # Arrange
    mock_collection.find_one.return_value = None  # Simulates auth failure

    # Act
    conversation = await conversation_repository.get_conversation_by_id(
        sample_conversation_id, other_user_id
    )

    # Assert
    assert conversation is None
    # Verify user_id was included in query
    call_args = mock_collection.find_one.call_args[0][0]
    assert "user_id" in call_args


@pytest.mark.asyncio
async def test_get_conversations_by_context(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test fetching conversations filtered by user_id."""
    # Arrange
    conversations_data = [
        {
            "_id": ObjectId(),
            "context_id": sample_context_id,
            "user_id": sample_user_id,
            "messages": [],
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
        for _ in range(3)
    ]

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=conversations_data)
    mock_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    conversations = await conversation_repository.get_conversations_by_context(
        sample_context_id, sample_user_id
    )

    # Assert
    assert len(conversations) == 3
    assert all(conv.user_id == sample_user_id for conv in conversations)
    # Verify query included both context_id and user_id
    call_args = mock_collection.find.call_args[0][0]
    assert call_args["context_id"] == sample_context_id
    assert call_args["user_id"] == sample_user_id


@pytest.mark.asyncio
async def test_get_conversations_by_context_sorted(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test conversations are sorted by updated_at descending."""
    # Arrange
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    await conversation_repository.get_conversations_by_context(
        sample_context_id, sample_user_id
    )

    # Assert
    mock_cursor.sort.assert_called_once_with("updated_at", -1)


@pytest.mark.asyncio
async def test_get_conversations_by_context_limit(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test limit parameter when creating conversations."""
    # Arrange
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    await conversation_repository.get_conversations_by_context(
        sample_context_id, sample_user_id, limit=5
    )

    # Assert
    mock_cursor.limit.assert_called_once_with(5)


@pytest.mark.asyncio
async def test_get_conversations_empty_context(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test fetching from context with no conversations returns empty list."""
    # Arrange
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    conversations = await conversation_repository.get_conversations_by_context(
        sample_context_id, sample_user_id
    )

    # Assert
    assert conversations == []


@pytest.mark.asyncio
async def test_get_conversations_filters_other_users(
    conversation_repository, mock_collection, sample_context_id, sample_user_id
):
    """Test that other users' conversations are not returned (security test)."""
    # Arrange
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_collection.find = MagicMock(return_value=mock_cursor)

    # Act
    await conversation_repository.get_conversations_by_context(
        sample_context_id, sample_user_id
    )

    # Assert - verify user_id filter was applied
    call_args = mock_collection.find.call_args[0][0]
    assert call_args["user_id"] == sample_user_id


@pytest.mark.asyncio
async def test_get_recent_messages_wrong_user(
    conversation_repository, mock_collection, sample_conversation_id, other_user_id
):
    """Test getting messages with wrong user_id returns empty list (security test)."""
    # Arrange
    mock_collection.find_one.return_value = None  # Simulates unauthorized

    # Act
    messages = await conversation_repository.get_recent_messages(
        sample_conversation_id, other_user_id
    )

    # Assert
    assert messages == []


# Task 11: Message Role Validation Tests


def test_message_role_validation():
    """Test valid message roles are accepted."""
    # Act & Assert
    user_msg = Message(
        role=MessageRole.USER, content="User message", timestamp=datetime.now(UTC)
    )
    assistant_msg = Message(
        role=MessageRole.ASSISTANT,
        content="Assistant message",
        timestamp=datetime.now(UTC),
    )
    system_msg = Message(
        role=MessageRole.SYSTEM, content="System message", timestamp=datetime.now(UTC)
    )

    assert user_msg.role == MessageRole.USER
    assert assistant_msg.role == MessageRole.ASSISTANT
    assert system_msg.role == MessageRole.SYSTEM


def test_message_role_invalid_value():
    """Test invalid role string is rejected."""
    # Act & Assert
    with pytest.raises(ValidationError):
        Message(
            role="invalid_role",  # type: ignore[arg-type]
            content="Test content",
            timestamp=datetime.now(UTC),
        )


def test_message_content_length_validation():
    """Test message content exceeding 10000 chars is rejected."""
    # Arrange
    long_content = "x" * 10001

    # Act & Assert
    with pytest.raises(ValidationError):
        Message(
            role=MessageRole.USER, content=long_content, timestamp=datetime.now(UTC)
        )


def test_message_content_empty_validation():
    """Test empty content string is rejected."""
    # Act & Assert
    with pytest.raises(ValidationError, match="String should have at least 1 character"):
        Message(role=MessageRole.USER, content="", timestamp=datetime.now(UTC))


def test_message_content_whitespace_only():
    """Test whitespace-only content is rejected."""
    # Act & Assert
    with pytest.raises(ValidationError, match="Message content cannot be empty"):
        Message(role=MessageRole.USER, content="   ", timestamp=datetime.now(UTC))
