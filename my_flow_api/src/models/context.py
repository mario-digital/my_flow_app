"""
Context Pydantic models for data validation and serialization.

MongoDB Indexes Required:
- Single field index: user_id
- Compound index: (user_id, created_at desc) for sorted listing
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class ContextBase(BaseModel):
    """Base schema for context entities."""
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str = Field(..., min_length=1, max_length=10)


class ContextCreate(ContextBase):
    """Schema for creating a context."""


class ContextUpdate(BaseModel):
    """Schema for updating a context (partial)."""
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str | None = Field(None, min_length=1, max_length=10)


class ContextInDB(ContextBase):
    """Complete context schema with DB fields."""
    id: str = Field(..., alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "logto_user_abc123",
                "name": "Work",
                "color": "#3B82F6",
                "icon": "💼",
                "created_at": "2025-09-30T10:00:00Z",
                "updated_at": "2025-09-30T10:00:00Z",
            }
        },
    )

    @field_serializer("id")
    def serialize_id(self, v: str) -> str:
        """Serialize ObjectId to string for JSON responses."""
        return str(v)


class ContextResponse(ContextInDB):
    """Schema for context API responses."""
