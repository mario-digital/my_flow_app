"""Integration tests for transition warnings endpoint."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app
from src.models.flow import FlowInDB
from src.routers.transitions import get_flow_repository
from tests.integration.routers.conftest import (
    create_mock_flow_repository,
    mock_auth_success,
)


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_flow_data():
    """Create mock flow data for testing."""

    def _create_flow(
        flow_id: str = "flow-test",
        title: str = "Test Flow",
        priority: str = "medium",
        is_completed: bool = False,
        due_date: datetime | None = None,
        context_id: str = "ctx-test",
    ) -> dict:
        return {
            "_id": flow_id,
            "title": title,
            "description": "Test description",
            "context_id": context_id,
            "user_id": "test_user_123",
            "priority": priority,
            "is_completed": is_completed,
            "due_date": due_date,
            "reminder_enabled": True,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }

    return _create_flow


@pytest.mark.integration
def test_get_warnings_endpoint(client, mock_flow_data):
    """Test GET /api/v1/transitions/warnings/{context_id} endpoint."""
    # Setup: Create mock flows (1 incomplete, 1 completed)
    flows = [
        FlowInDB(**mock_flow_data(flow_id="flow-1", title="Incomplete Task", is_completed=False)),
        FlowInDB(**mock_flow_data(flow_id="flow-2", title="Completed Task", is_completed=True)),
    ]

    with mock_auth_success():
        mock_flow_repo = create_mock_flow_repository(
            get_all_by_context=AsyncMock(return_value=flows)
        )
        app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

        response = client.get(
            "/api/v1/transitions/warnings/ctx-test",
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "context_id" in data
        assert "incomplete_count" in data
        assert "overdue_count" in data
        assert "overdue_flows" in data
        assert isinstance(data["overdue_flows"], list)
        assert data["context_id"] == "ctx-test"
        assert data["incomplete_count"] == 1  # Only flow-1 is incomplete
        assert data["overdue_count"] == 0  # No overdue flows


@pytest.mark.integration
def test_warnings_unauthorized_access(client):
    """Test endpoint requires authentication."""
    # Call without auth header
    response = client.get(
        "/api/v1/transitions/warnings/ctx-work",
        headers={},  # No Authorization header
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
def test_warnings_with_overdue_flows(client, mock_flow_data):
    """Test warnings include overdue flow details."""
    # Setup: Create overdue flow
    overdue_date = datetime.now(UTC) - timedelta(days=2)
    flows = [
        FlowInDB(
            **mock_flow_data(
                flow_id="flow-overdue",
                title="Overdue Task",
                priority="high",
                is_completed=False,
                due_date=overdue_date,
            )
        ),
    ]

    with mock_auth_success():
        mock_flow_repo = create_mock_flow_repository(
            get_all_by_context=AsyncMock(return_value=flows)
        )
        app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

        response = client.get(
            "/api/v1/transitions/warnings/ctx-test",
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["incomplete_count"] == 1
        assert data["overdue_count"] == 1
        assert len(data["overdue_flows"]) == 1

        # Verify overdue flow structure
        overdue_flow = data["overdue_flows"][0]
        assert "id" in overdue_flow
        assert "title" in overdue_flow
        assert "due_date" in overdue_flow
        assert overdue_flow["id"] == "flow-overdue"
        assert overdue_flow["title"] == "Overdue Task"
