"""Pydantic models for AI conversation messages."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class MessageRole(str, Enum):
    """Message role enum for type safety."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    """Individual message in a conversation."""

    role: MessageRole
    content: str = Field(..., min_length=1, max_length=10000)
    timestamp: datetime | None = None

    @field_validator("content")
    @classmethod
    def validate_content_length(cls, v: str) -> str:
        """Validate message content length is within acceptable range."""
        if not v or len(v.strip()) == 0:
            msg = "Message content cannot be empty"
            raise ValueError(msg)
        if len(v) > 10000:
            msg = "Message content cannot exceed 10000 characters"
            raise ValueError(msg)
        return v


class ConversationRequest(BaseModel):
    """Request model for conversation endpoints."""

    messages: list[Message] = Field(..., min_length=1)
    context_id: str = Field(..., min_length=1)

    @field_validator("messages")
    @classmethod
    def validate_messages_not_empty(cls, v: list[Message]) -> list[Message]:
        """Validate that messages list is not empty."""
        if not v or len(v) == 0:
            msg = "Messages list cannot be empty"
            raise ValueError(msg)
        return v
