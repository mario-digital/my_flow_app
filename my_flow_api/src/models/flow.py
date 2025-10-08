"""
Flow Pydantic models for data validation and serialization.

MongoDB Indexes Required:
- Single field index: context_id
- Compound index: (context_id, is_completed, priority) for filtered/sorted queries
"""

from datetime import datetime
from enum import Enum

from bson import ObjectId as BsonObjectId
from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
)


class FlowPriority(str, Enum):
    """Priority levels for flows."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class FlowStatus(str, Enum):
    """Status indicators for flow due dates (for future service layer use)."""

    OVERDUE = "overdue"
    DUE_TODAY = "due_today"
    DUE_SOON = "due_soon"
    NORMAL = "normal"


class FlowBase(BaseModel):
    """Base schema for flow entities."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    priority: FlowPriority = FlowPriority.MEDIUM
    due_date: datetime | None = None
    reminder_enabled: bool = True

    @field_validator("due_date")
    @classmethod
    def ensure_timezone_aware(cls, v: datetime | None) -> datetime | None:
        """Validate that due_date includes timezone info (UTC required)."""
        if v is not None and v.tzinfo is None:
            msg = "due_date must be timezone-aware (UTC recommended)"
            raise ValueError(msg)
        return v


class FlowCreate(FlowBase):
    """Schema for creating a flow."""

    context_id: str


class FlowUpdate(BaseModel):
    """Schema for updating a flow (partial)."""

    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    priority: FlowPriority | None = None
    due_date: datetime | None = None
    reminder_enabled: bool | None = None

    @field_validator("due_date")
    @classmethod
    def ensure_timezone_aware(cls, v: datetime | None) -> datetime | None:
        """Validate that due_date includes timezone info (UTC required)."""
        if v is not None and v.tzinfo is None:
            msg = "due_date must be timezone-aware (UTC recommended)"
            raise ValueError(msg)
        return v


class FlowInDB(FlowBase):
    """Complete flow schema with DB fields."""

    id: str = Field(
        ...,
        validation_alias=AliasChoices("_id", "id"),
        serialization_alias="id",
    )
    context_id: str
    user_id: str
    is_completed: bool = False
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "context_id": "507f1f77bcf86cd799439022",
                "user_id": "logto_user_abc123",
                "title": "Complete project documentation",
                "description": "Write comprehensive API docs",
                "priority": "high",
                "is_completed": False,
                "due_date": "2025-10-15T17:00:00Z",
                "reminder_enabled": True,
                "created_at": "2025-10-05T10:00:00Z",
                "updated_at": "2025-10-05T10:00:00Z",
                "completed_at": None,
            }
        },
    )

    @field_validator("id", mode="before")
    @classmethod
    def convert_object_id(cls, v: object) -> str:
        """Convert MongoDB ObjectId to string."""
        if isinstance(v, BsonObjectId):
            return str(v)
        return str(v) if v else ""

    @field_serializer("id")
    def serialize_id(self, v: str) -> str:
        """Serialize ObjectId to string for JSON responses."""
        return str(v)


class FlowResponse(FlowInDB):
    """Schema for flow API responses."""


class FlowWithStatus(FlowInDB):
    """Flow with computed status fields for future service layer use."""

    status: FlowStatus | None = None
    days_until_due: int | None = None
