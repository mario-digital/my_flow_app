"""
Repository for conversation CRUD operations with user isolation.

Provides async methods for managing conversations and messages in MongoDB,
enforcing defense-in-depth security through repository-level user isolation.
"""

from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.models.conversation import Conversation, Message
from src.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    """
    Repository for conversation storage with user isolation enforcement.

    All methods enforce user isolation at the data access layer to prevent
    cross-user data leakage, following defense-in-depth security principles.
    """

    def __init__(self, db: AsyncIOMotorDatabase) -> None:  # type: ignore[type-arg]
        """
        Initialize conversation repository.

        Args:
            db: MongoDB database instance
        """
        super().__init__(db, "conversations", Conversation)

    async def create_conversation(self, context_id: str, user_id: str) -> Conversation:
        """
        Create a new empty conversation for a user in a context.

        Args:
            context_id: Parent context reference
            user_id: Owner of the conversation

        Returns:
            Created conversation with empty messages list

        Raises:
            RuntimeError: If conversation creation fails
        """
        now = datetime.now(UTC)
        doc = {
            "context_id": context_id,
            "user_id": user_id,
            "messages": [],
            "created_at": now,
            "updated_at": now,
        }

        result = await self.collection.insert_one(doc)
        created_doc = await self.collection.find_one({"_id": result.inserted_id})

        if created_doc is None:
            msg = f"Failed to retrieve created conversation with ID {result.inserted_id}"
            raise RuntimeError(msg)

        # Convert _id to string for Pydantic model
        created_doc["_id"] = str(created_doc["_id"])
        return Conversation(**created_doc)

    async def get_conversation_by_id(
        self, conversation_id: str, user_id: str
    ) -> Conversation | None:
        """
        Get conversation by ID with user isolation enforcement.

        Args:
            conversation_id: Conversation ID to retrieve
            user_id: User ID for authorization (defense-in-depth)

        Returns:
            Conversation if found and owned by user, None otherwise

        Note:
            Returns None if conversation doesn't exist OR if user doesn't own it.
            This prevents information leakage about conversation existence.
        """
        try:
            obj_id = ObjectId(conversation_id)
        except (InvalidId, TypeError):
            return None

        # SECURITY: Include user_id in query for defense-in-depth
        doc = await self.collection.find_one({"_id": obj_id, "user_id": user_id})

        if doc is None:
            return None

        # Convert _id to string for Pydantic model
        doc["_id"] = str(doc["_id"])
        return Conversation(**doc)

    async def get_conversations_by_context(
        self, context_id: str, user_id: str, limit: int = 10
    ) -> list[Conversation]:
        """
        Get conversations for a context with user isolation.

        Args:
            context_id: Context ID to filter by
            user_id: User ID for authorization (defense-in-depth)
            limit: Maximum number of conversations to return (default: 10)

        Returns:
            List of conversations owned by user, sorted by most recent first

        Note:
            Only returns conversations owned by the user. Other users'
            conversations in the same context are filtered out.
        """
        # SECURITY: Include both context_id AND user_id to prevent cross-user access
        query = {"context_id": context_id, "user_id": user_id}

        cursor = self.collection.find(query).sort("updated_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)

        # Convert _id to string for each document
        conversations = []
        for doc in docs:
            doc["_id"] = str(doc["_id"])
            conversations.append(Conversation(**doc))

        return conversations

    async def append_message(
        self, conversation_id: str, message: Message, user_id: str
    ) -> Conversation:
        """
        Append message to conversation with atomic authorization.

        Args:
            conversation_id: Conversation ID to append to
            message: Message to append
            user_id: User ID for authorization (defense-in-depth)

        Returns:
            Updated conversation with appended message

        Raises:
            ValueError: If conversation not found or user not authorized

        Note:
            Uses atomic find_one_and_update to prevent TOCTOU race conditions.
            Authorization check is performed atomically with the update.
        """
        # Prepare message dict (avoid mutating input parameter)
        message_dict = message.model_dump()
        message_dict["timestamp"] = message_dict.get("timestamp") or datetime.now(UTC)

        try:
            obj_id = ObjectId(conversation_id)
        except (InvalidId, TypeError) as e:
            msg = f"Invalid conversation ID: {conversation_id}"
            raise ValueError(msg) from e

        # SECURITY: Atomic authorization check + update prevents TOCTOU vulnerability
        result = await self.collection.find_one_and_update(
            {"_id": obj_id, "user_id": user_id},  # Authorization filter
            {
                "$push": {"messages": message_dict},
                "$set": {"updated_at": datetime.now(UTC)},
            },
            return_document=True,
        )

        if result is None:
            msg = "Conversation not found or unauthorized"
            raise ValueError(msg)

        # Convert _id to string for Pydantic model
        result["_id"] = str(result["_id"])
        return Conversation(**result)

    async def get_recent_messages(
        self, conversation_id: str, user_id: str, limit: int = 20
    ) -> list[Message]:
        """
        Get recent messages from a conversation with user isolation.

        Args:
            conversation_id: Conversation ID to retrieve messages from
            user_id: User ID for authorization (defense-in-depth)
            limit: Maximum number of recent messages to return (default: 20)

        Returns:
            List of recent messages in chronological order (oldest to newest).
            Returns empty list if conversation not found or user not authorized.

        Note:
            Messages are returned in chronological order (oldest to newest).
            This method enforces user isolation by delegating to get_conversation_by_id.
        """
        conversation = await self.get_conversation_by_id(conversation_id, user_id)

        if conversation is None:
            return []

        # Return last 'limit' messages using array slicing
        return conversation.messages[-limit:]
