"""Unit tests for Context Pydantic models."""

import pytest
from datetime import datetime
from pydantic import ValidationError

from src.models.context import (
    ContextBase,
    ContextCreate,
    ContextUpdate,
    ContextInDB,
    ContextResponse,
)


class TestContextCreate:
    """Tests for ContextCreate model."""

    def test_valid_context_create(self):
        """Test creating a valid context."""
        data = {
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
        }
        context = ContextCreate(**data)
        assert context.name == "Work"
        assert context.color == "#3B82F6"
        assert context.icon == "💼"

    def test_name_too_short(self):
        """Test validation fails when name is empty."""
        data = {
            "name": "",
            "color": "#3B82F6",
            "icon": "💼",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "name" in str(exc_info.value)

    def test_name_too_long(self):
        """Test validation fails when name exceeds 50 characters."""
        data = {
            "name": "a" * 51,
            "color": "#3B82F6",
            "icon": "💼",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "name" in str(exc_info.value)

    def test_name_max_length_valid(self):
        """Test name with exactly 50 characters is valid."""
        data = {
            "name": "a" * 50,
            "color": "#3B82F6",
            "icon": "💼",
        }
        context = ContextCreate(**data)
        assert len(context.name) == 50

    def test_invalid_color_format_no_hash(self):
        """Test validation fails for color without # prefix."""
        data = {
            "name": "Work",
            "color": "3B82F6",
            "icon": "💼",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "color" in str(exc_info.value)

    def test_invalid_color_format_too_short(self):
        """Test validation fails for color with less than 6 hex digits."""
        data = {
            "name": "Work",
            "color": "#3B82",
            "icon": "💼",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "color" in str(exc_info.value)

    def test_invalid_color_format_too_long(self):
        """Test validation fails for color with more than 6 hex digits."""
        data = {
            "name": "Work",
            "color": "#3B82F6A",
            "icon": "💼",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "color" in str(exc_info.value)

    def test_invalid_color_format_invalid_chars(self):
        """Test validation fails for color with non-hex characters."""
        data = {
            "name": "Work",
            "color": "#GGGGGG",
            "icon": "💼",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "color" in str(exc_info.value)

    def test_valid_color_lowercase(self):
        """Test lowercase hex color is valid."""
        data = {
            "name": "Work",
            "color": "#3b82f6",
            "icon": "💼",
        }
        context = ContextCreate(**data)
        assert context.color == "#3b82f6"

    def test_empty_icon(self):
        """Test validation fails for empty icon."""
        data = {
            "name": "Work",
            "color": "#3B82F6",
            "icon": "",
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "icon" in str(exc_info.value)

    def test_icon_too_long(self):
        """Test validation fails for icon longer than 10 characters."""
        data = {
            "name": "Work",
            "color": "#3B82F6",
            "icon": "a" * 11,
        }
        with pytest.raises(ValidationError) as exc_info:
            ContextCreate(**data)
        assert "icon" in str(exc_info.value)

    def test_icon_multi_byte_emoji(self):
        """Test multi-byte emoji icons are valid."""
        data = {
            "name": "Work",
            "color": "#3B82F6",
            "icon": "👨‍💻",  # Multi-byte emoji
        }
        context = ContextCreate(**data)
        assert context.icon == "👨‍💻"


class TestContextUpdate:
    """Tests for ContextUpdate model."""

    def test_partial_update_name_only(self):
        """Test updating only name field."""
        data = {"name": "Personal"}
        update = ContextUpdate(**data)
        assert update.name == "Personal"
        assert update.color is None
        assert update.icon is None

    def test_partial_update_color_only(self):
        """Test updating only color field."""
        data = {"color": "#FF0000"}
        update = ContextUpdate(**data)
        assert update.color == "#FF0000"
        assert update.name is None
        assert update.icon is None

    def test_partial_update_all_fields(self):
        """Test updating all fields."""
        data = {
            "name": "Updated",
            "color": "#00FF00",
            "icon": "🎯",
        }
        update = ContextUpdate(**data)
        assert update.name == "Updated"
        assert update.color == "#00FF00"
        assert update.icon == "🎯"

    def test_empty_update(self):
        """Test creating update with no fields."""
        update = ContextUpdate()
        assert update.name is None
        assert update.color is None
        assert update.icon is None

    def test_update_validates_name_length(self):
        """Test update validates name length when provided."""
        data = {"name": "a" * 51}
        with pytest.raises(ValidationError) as exc_info:
            ContextUpdate(**data)
        assert "name" in str(exc_info.value)

    def test_update_validates_color_format(self):
        """Test update validates color format when provided."""
        data = {"color": "invalid"}
        with pytest.raises(ValidationError) as exc_info:
            ContextUpdate(**data)
        assert "color" in str(exc_info.value)


class TestContextInDB:
    """Tests for ContextInDB model."""

    def test_context_in_db_valid(self):
        """Test creating a valid ContextInDB instance."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "logto_user_abc123",
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
            "created_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
            "updated_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
        }
        context = ContextInDB(**data)
        assert context.id == "507f1f77bcf86cd799439011"
        assert context.user_id == "logto_user_abc123"
        assert context.name == "Work"

    def test_context_in_db_alias_id(self):
        """Test _id alias maps to id field."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "logto_user_abc123",
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
            "created_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
            "updated_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
        }
        context = ContextInDB(**data)
        assert context.id == "507f1f77bcf86cd799439011"

    def test_context_in_db_serialization(self):
        """Test ContextInDB serializes to dict correctly."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "logto_user_abc123",
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
            "created_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
            "updated_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
        }
        context = ContextInDB(**data)
        context_dict = context.model_dump()
        assert "id" in context_dict
        assert context_dict["id"] == "507f1f77bcf86cd799439011"
        assert context_dict["name"] == "Work"

    def test_context_in_db_json_serialization(self):
        """Test ContextInDB serializes to JSON correctly."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "logto_user_abc123",
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
            "created_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
            "updated_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
        }
        context = ContextInDB(**data)
        json_str = context.model_dump_json()
        assert "507f1f77bcf86cd799439011" in json_str
        assert "Work" in json_str


class TestContextResponse:
    """Tests for ContextResponse model."""

    def test_context_response_is_alias(self):
        """Test ContextResponse works identically to ContextInDB."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "logto_user_abc123",
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼",
            "created_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
            "updated_at": datetime.fromisoformat("2025-09-30T10:00:00+00:00"),
        }
        response = ContextResponse(**data)
        assert response.id == "507f1f77bcf86cd799439011"
        assert response.name == "Work"
