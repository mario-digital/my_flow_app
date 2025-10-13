"""
User Preferences Pydantic models for data validation and serialization.

MongoDB Indexes Required:
- Unique index: user_id (each user has exactly one preferences document)
"""

from datetime import datetime

from bson import ObjectId as BsonObjectId
from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
)


class UserPreferencesBase(BaseModel):
    """Base schema for user preferences."""

    onboarding_completed: bool = Field(default=False)
    onboarding_completed_at: datetime | None = Field(default=None)
    current_context_id: str | None = Field(default=None)
    theme: str | None = Field(default=None, pattern=r"^(light|dark|system)$")
    notifications_enabled: bool = Field(default=True)


class UserPreferencesCreate(UserPreferencesBase):
    """Schema for creating user preferences."""


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences (partial)."""

    onboarding_completed: bool | None = None
    onboarding_completed_at: datetime | None = None
    current_context_id: str | None = None
    theme: str | None = Field(default=None, pattern=r"^(light|dark|system)$")
    notifications_enabled: bool | None = None


class UserPreferencesInDB(UserPreferencesBase):
    """Complete user preferences schema with DB fields."""

    id: str = Field(
        ...,
        validation_alias=AliasChoices("_id", "id"),
        serialization_alias="id",
    )
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
                "onboarding_completed": True,
                "onboarding_completed_at": "2025-01-12T10:00:00Z",
                "current_context_id": "507f1f77bcf86cd799439012",
                "theme": "dark",
                "notifications_enabled": True,
                "created_at": "2025-01-12T10:00:00Z",
                "updated_at": "2025-01-12T10:00:00Z",
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


class UserPreferencesResponse(UserPreferencesInDB):
    """Schema for user preferences API responses."""
