"""Unit tests for Flow Pydantic models."""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from src.models.flow import (
    FlowPriority,
    FlowStatus,
    FlowBase,
    FlowCreate,
    FlowUpdate,
    FlowInDB,
    FlowResponse,
    FlowWithStatus,
)


class TestFlowPriority:
    """Tests for FlowPriority enum."""

    def test_priority_values(self):
        """Test enum has correct values."""
        assert FlowPriority.LOW == "low"
        assert FlowPriority.MEDIUM == "medium"
        assert FlowPriority.HIGH == "high"

    def test_priority_is_string_enum(self):
        """Test priority enum values are strings."""
        assert isinstance(FlowPriority.LOW.value, str)
        assert isinstance(FlowPriority.MEDIUM.value, str)
        assert isinstance(FlowPriority.HIGH.value, str)


class TestFlowStatus:
    """Tests for FlowStatus enum."""

    def test_status_values(self):
        """Test enum has correct values."""
        assert FlowStatus.OVERDUE == "overdue"
        assert FlowStatus.DUE_TODAY == "due_today"
        assert FlowStatus.DUE_SOON == "due_soon"
        assert FlowStatus.NORMAL == "normal"


class TestFlowCreate:
    """Tests for FlowCreate model."""

    def test_valid_flow_create_minimal(self):
        """Test creating a valid flow with minimal required fields."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
        }
        flow = FlowCreate(**data)
        assert flow.context_id == "507f1f77bcf86cd799439022"
        assert flow.title == "Complete documentation"
        assert flow.priority == FlowPriority.MEDIUM
        assert flow.reminder_enabled is True
        assert flow.description is None
        assert flow.due_date is None

    def test_valid_flow_create_all_fields(self):
        """Test creating a valid flow with all fields."""
        due_date = datetime(2025, 10, 15, 17, 0, 0, tzinfo=timezone.utc)
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
            "description": "Write comprehensive API docs",
            "priority": FlowPriority.HIGH,
            "due_date": due_date,
            "reminder_enabled": True,
        }
        flow = FlowCreate(**data)
        assert flow.context_id == "507f1f77bcf86cd799439022"
        assert flow.title == "Complete documentation"
        assert flow.description == "Write comprehensive API docs"
        assert flow.priority == FlowPriority.HIGH
        assert flow.due_date == due_date
        assert flow.reminder_enabled is True

    def test_title_too_short(self):
        """Test validation fails when title is empty."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "",
        }
        with pytest.raises(ValidationError) as exc_info:
            FlowCreate(**data)
        assert "title" in str(exc_info.value)

    def test_title_too_long(self):
        """Test validation fails when title exceeds 200 characters."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "a" * 201,
        }
        with pytest.raises(ValidationError) as exc_info:
            FlowCreate(**data)
        assert "title" in str(exc_info.value)

    def test_title_max_length_valid(self):
        """Test title with exactly 200 characters is valid."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "a" * 200,
        }
        flow = FlowCreate(**data)
        assert len(flow.title) == 200

    def test_invalid_priority_string(self):
        """Test validation fails for invalid priority string."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
            "priority": "invalid",
        }
        with pytest.raises(ValidationError) as exc_info:
            FlowCreate(**data)
        assert "priority" in str(exc_info.value)

    def test_priority_enum_usage(self):
        """Test priority can be set using enum."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
            "priority": FlowPriority.HIGH,
        }
        flow = FlowCreate(**data)
        assert flow.priority == FlowPriority.HIGH

    def test_priority_string_value_usage(self):
        """Test priority can be set using string value."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
            "priority": "high",
        }
        flow = FlowCreate(**data)
        assert flow.priority == FlowPriority.HIGH

    def test_default_priority_is_medium(self):
        """Test default priority is MEDIUM when not provided."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
        }
        flow = FlowCreate(**data)
        assert flow.priority == FlowPriority.MEDIUM

    def test_reminder_enabled_defaults_to_true(self):
        """Test reminder_enabled defaults to True."""
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
        }
        flow = FlowCreate(**data)
        assert flow.reminder_enabled is True

    def test_due_date_timezone_aware_required(self):
        """Test validation fails for naive datetime (no timezone)."""
        naive_datetime = datetime(2025, 10, 15, 17, 0, 0)
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
            "due_date": naive_datetime,
        }
        with pytest.raises(ValidationError) as exc_info:
            FlowCreate(**data)
        assert "timezone-aware" in str(exc_info.value).lower()

    def test_due_date_timezone_aware_valid(self):
        """Test timezone-aware datetime is valid."""
        aware_datetime = datetime(2025, 10, 15, 17, 0, 0, tzinfo=timezone.utc)
        data = {
            "context_id": "507f1f77bcf86cd799439022",
            "title": "Complete documentation",
            "due_date": aware_datetime,
        }
        flow = FlowCreate(**data)
        assert flow.due_date == aware_datetime
        assert flow.due_date.tzinfo is not None


class TestFlowUpdate:
    """Tests for FlowUpdate model."""

    def test_partial_update_title_only(self):
        """Test updating only title field."""
        data = {"title": "Updated title"}
        update = FlowUpdate(**data)
        assert update.title == "Updated title"
        assert update.description is None
        assert update.priority is None
        assert update.due_date is None
        assert update.reminder_enabled is None

    def test_partial_update_priority_only(self):
        """Test updating only priority field."""
        data = {"priority": FlowPriority.LOW}
        update = FlowUpdate(**data)
        assert update.priority == FlowPriority.LOW
        assert update.title is None

    def test_partial_update_due_date_to_none(self):
        """Test updating due_date to None (clearing it)."""
        data = {"due_date": None}
        update = FlowUpdate(**data)
        assert update.due_date is None

    def test_partial_update_all_fields(self):
        """Test updating all fields."""
        due_date = datetime(2025, 10, 15, 17, 0, 0, tzinfo=timezone.utc)
        data = {
            "title": "Updated title",
            "description": "Updated description",
            "priority": FlowPriority.HIGH,
            "due_date": due_date,
            "reminder_enabled": False,
        }
        update = FlowUpdate(**data)
        assert update.title == "Updated title"
        assert update.description == "Updated description"
        assert update.priority == FlowPriority.HIGH
        assert update.due_date == due_date
        assert update.reminder_enabled is False

    def test_empty_update(self):
        """Test creating update with no fields."""
        update = FlowUpdate()
        assert update.title is None
        assert update.description is None
        assert update.priority is None
        assert update.due_date is None
        assert update.reminder_enabled is None

    def test_update_validates_title_length(self):
        """Test update validates title length when provided."""
        data = {"title": "a" * 201}
        with pytest.raises(ValidationError) as exc_info:
            FlowUpdate(**data)
        assert "title" in str(exc_info.value)

    def test_update_validates_due_date_timezone(self):
        """Test update validates due_date timezone when provided."""
        naive_datetime = datetime(2025, 10, 15, 17, 0, 0)
        data = {"due_date": naive_datetime}
        with pytest.raises(ValidationError) as exc_info:
            FlowUpdate(**data)
        assert "timezone-aware" in str(exc_info.value).lower()


class TestFlowInDB:
    """Tests for FlowInDB model."""

    def test_flow_in_db_valid(self):
        """Test creating a valid FlowInDB instance."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "description": "Write comprehensive API docs",
            "priority": FlowPriority.HIGH,
            "is_completed": False,
            "due_date": datetime(2025, 10, 15, 17, 0, 0, tzinfo=timezone.utc),
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "completed_at": None,
        }
        flow = FlowInDB(**data)
        assert flow.id == "507f1f77bcf86cd799439011"
        assert flow.context_id == "507f1f77bcf86cd799439022"
        assert flow.user_id == "logto_user_abc123"
        assert flow.title == "Complete documentation"
        assert flow.is_completed is False

    def test_flow_in_db_alias_id(self):
        """Test _id alias maps to id field."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "priority": FlowPriority.MEDIUM,
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
        }
        flow = FlowInDB(**data)
        assert flow.id == "507f1f77bcf86cd799439011"

    def test_flow_in_db_serialization(self):
        """Test FlowInDB serializes to dict correctly."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "priority": FlowPriority.HIGH,
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
        }
        flow = FlowInDB(**data)
        flow_dict = flow.model_dump()
        assert "id" in flow_dict
        assert flow_dict["id"] == "507f1f77bcf86cd799439011"
        assert flow_dict["title"] == "Complete documentation"
        assert flow_dict["priority"] == FlowPriority.HIGH

    def test_flow_in_db_json_serialization(self):
        """Test FlowInDB serializes to JSON correctly."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "priority": FlowPriority.HIGH,
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
        }
        flow = FlowInDB(**data)
        json_str = flow.model_dump_json()
        assert "507f1f77bcf86cd799439011" in json_str
        assert "Complete documentation" in json_str
        assert "high" in json_str  # JSON value matches enum value

    def test_flow_priority_default_in_db(self):
        """Test priority defaults to MEDIUM in FlowInDB."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
        }
        flow = FlowInDB(**data)
        assert flow.priority == FlowPriority.MEDIUM


class TestFlowResponse:
    """Tests for FlowResponse model."""

    def test_flow_response_is_alias(self):
        """Test FlowResponse works identically to FlowInDB."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "priority": FlowPriority.HIGH,
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
        }
        response = FlowResponse(**data)
        assert response.id == "507f1f77bcf86cd799439011"
        assert response.title == "Complete documentation"


class TestFlowWithStatus:
    """Tests for FlowWithStatus model."""

    def test_flow_with_status_valid(self):
        """Test creating a valid FlowWithStatus instance."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "priority": FlowPriority.HIGH,
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "status": FlowStatus.DUE_SOON,
            "days_until_due": 5,
        }
        flow = FlowWithStatus(**data)
        assert flow.status == FlowStatus.DUE_SOON
        assert flow.days_until_due == 5

    def test_flow_with_status_optional_fields(self):
        """Test FlowWithStatus with optional status fields as None."""
        data = {
            "_id": "507f1f77bcf86cd799439011",
            "context_id": "507f1f77bcf86cd799439022",
            "user_id": "logto_user_abc123",
            "title": "Complete documentation",
            "priority": FlowPriority.MEDIUM,
            "is_completed": False,
            "reminder_enabled": True,
            "created_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 10, 5, 10, 0, 0, tzinfo=timezone.utc),
        }
        flow = FlowWithStatus(**data)
        assert flow.status is None
        assert flow.days_until_due is None
