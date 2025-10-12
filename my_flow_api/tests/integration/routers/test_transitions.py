"""Integration tests for Transition API routes."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from bson import ObjectId
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app
from src.models.flow import FlowInDB
from src.routers.transitions import (
    get_context_repository,
    get_flow_repository,
)
from tests.integration.routers.conftest import (
    create_mock_context_repository,
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
        flow_id: str | None = None,
        title: str = "Test Flow",
        priority: str = "medium",
        is_completed: bool = False,
        due_date: datetime | None = None,
        context_id: str = "ctx-test",
    ) -> dict:
        return {
            "_id": ObjectId(flow_id) if flow_id else ObjectId(),
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
class TestGetTransitionSuggestions:
    """Tests for GET /api/v1/transitions/suggestions endpoint."""

    def test_requires_authentication(self, client):
        """Test that endpoint requires authentication."""
        response = client.get(
            "/api/v1/transitions/suggestions",
            params={"from": "ctx-work", "to": "ctx-personal"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_requires_from_parameter(self, client):
        """Test that endpoint validates 'from' query parameter."""
        with mock_auth_success():
            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"to": "ctx-personal"},  # Missing 'from'
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_requires_to_parameter(self, client):
        """Test that endpoint validates 'to' query parameter."""
        with mock_auth_success():
            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work"},  # Missing 'to'
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_no_incomplete_flows(self, client):
        """Test suggestions when no incomplete flows exist."""
        with mock_auth_success():
            mock_context_repo = create_mock_context_repository()
            mock_flow_repo = create_mock_flow_repository(
                get_all_by_context=AsyncMock(return_value=[])
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work", "to": "ctx-personal"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["from_context"] == "ctx-work"
            assert data["to_context"] == "ctx-personal"
            assert len(data["warnings"]) == 0
            assert "No pending flows" in data["suggestions"][0]
            assert len(data["urgent_flows"]) == 0

    def test_incomplete_flows_in_source_context(self, client, mock_flow_data):
        """Test warnings when source context has incomplete flows."""
        source_flows = [
            FlowInDB(**mock_flow_data(title="Task 1", priority="high")),
            FlowInDB(**mock_flow_data(title="Task 2", priority="medium")),
            FlowInDB(**mock_flow_data(title="Task 3", priority="low")),
        ]

        with mock_auth_success():
            mock_context_repo = create_mock_context_repository()
            mock_flow_repo = create_mock_flow_repository(
                get_all_by_context=AsyncMock(
                    side_effect=[
                        source_flows,  # Source context
                        [],  # Target context
                    ]
                )
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work", "to": "ctx-personal"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data["warnings"]) > 0
            assert "3 incomplete flows" in data["warnings"][0]
            assert "1 of them are high priority" in data["warnings"][1]

    def test_urgent_flows_due_today(self, client, mock_flow_data):
        """Test detection of flows due today."""
        due_today = datetime.now(UTC) + timedelta(hours=3)
        target_flows = [
            FlowInDB(**mock_flow_data(title="Urgent Task", priority="high", due_date=due_today))
        ]

        with mock_auth_success():
            mock_context_repo = create_mock_context_repository()
            mock_flow_repo = create_mock_flow_repository(
                get_all_by_context=AsyncMock(
                    side_effect=[
                        [],  # Source context
                        target_flows,  # Target context
                    ]
                )
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work", "to": "ctx-personal"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data["urgent_flows"]) == 1
            assert data["urgent_flows"][0]["id"]
            assert "due today" in data["suggestions"][0]

    def test_overdue_flows(self, client, mock_flow_data):
        """Test detection of overdue flows."""
        overdue = datetime.now(UTC) - timedelta(days=2)
        target_flows = [
            FlowInDB(**mock_flow_data(title="Overdue Task", priority="high", due_date=overdue))
        ]

        with mock_auth_success():
            mock_context_repo = create_mock_context_repository()
            mock_flow_repo = create_mock_flow_repository(
                get_all_by_context=AsyncMock(
                    side_effect=[
                        [],  # Source context
                        target_flows,  # Target context
                    ]
                )
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work", "to": "ctx-personal"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data["urgent_flows"]) == 1
            assert "overdue" in data["suggestions"][0]

    def test_response_structure(self, client):
        """Test that response includes all required fields."""
        with mock_auth_success():
            mock_context_repo = create_mock_context_repository()
            mock_flow_repo = create_mock_flow_repository(
                get_all_by_context=AsyncMock(return_value=[])
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work", "to": "ctx-personal"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "from_context" in data
            assert "to_context" in data
            assert "warnings" in data
            assert "suggestions" in data
            assert "urgent_flows" in data
            assert isinstance(data["warnings"], list)
            assert isinstance(data["suggestions"], list)
            assert isinstance(data["urgent_flows"], list)

    def test_complex_scenario_with_mixed_priorities(self, client, mock_flow_data):
        """Test complex scenario with multiple priorities and due dates."""
        now = datetime.now(UTC)
        due_today = now + timedelta(hours=2)
        overdue = now - timedelta(days=1)

        source_flows = [
            FlowInDB(**mock_flow_data(title="Source 1", priority="high")),
            FlowInDB(**mock_flow_data(title="Source 2", priority="medium")),
        ]

        target_flows = [
            FlowInDB(**mock_flow_data(title="Overdue High", priority="high", due_date=overdue)),
            FlowInDB(**mock_flow_data(title="Due Today High", priority="high", due_date=due_today)),
            FlowInDB(**mock_flow_data(title="No Date High", priority="high")),
            FlowInDB(**mock_flow_data(title="Medium Priority", priority="medium")),
        ]

        with mock_auth_success():
            mock_context_repo = create_mock_context_repository()
            mock_flow_repo = create_mock_flow_repository(
                get_all_by_context=AsyncMock(
                    side_effect=[
                        source_flows,  # Source context
                        target_flows,  # Target context
                    ]
                )
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            response = client.get(
                "/api/v1/transitions/suggestions",
                params={"from": "ctx-work", "to": "ctx-personal"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            # Should have warnings about source context
            assert len(data["warnings"]) > 0
            assert "2 incomplete flows" in data["warnings"][0]
            # Should have urgent flows (all except medium priority)
            assert len(data["urgent_flows"]) == 3
            # Should have suggestions about overdue and due today
            assert any("overdue" in s for s in data["suggestions"])
            assert any("due today" in s for s in data["suggestions"])
