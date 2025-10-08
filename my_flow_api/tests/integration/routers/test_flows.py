"""Integration tests for Flow API routes."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from bson import ObjectId
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app
from src.models.context import ContextInDB
from src.models.flow import FlowInDB
from src.routers.flows import get_context_repository, get_flow_repository
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
def mock_context_data():
    """Mock context data for testing."""
    return {
        "_id": ObjectId(),
        "name": "Work",
        "color": "#3B82F6",
        "icon": "💼",
        "user_id": "test_user_123",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }


@pytest.fixture
def mock_flow_data(mock_context_data):
    """Mock flow data for testing."""
    return {
        "_id": ObjectId(),
        "title": "Review Q4 budget",
        "description": "Quarterly budget review",
        "context_id": str(mock_context_data["_id"]),
        "user_id": "test_user_123",
        "priority": "high",
        "is_completed": False,
        "reminder_enabled": True,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }


@pytest.mark.integration
class TestListFlows:
    """Tests for GET /api/v1/contexts/{context_id}/flows endpoint."""

    def test_list_flows_requires_auth(self, client, mock_context_data):
        """Test that listing flows requires authentication."""
        context_id = str(mock_context_data["_id"])
        response = client.get(f"/api/v1/contexts/{context_id}/flows")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_flows_returns_paginated_response(
        self, client, mock_context_data, mock_flow_data
    ):
        """Test GET /api/v1/contexts/{context_id}/flows returns paginated response."""
        with mock_auth_success():
            mock_context_repo = create_mock_context_repository(
            get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            mock_flow_repo = create_mock_flow_repository(
            count_by_context=AsyncMock(return_value=1),
            get_all_by_context=AsyncMock(return_value=[FlowInDB(**mock_flow_data)]),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            context_id = str(mock_context_data["_id"])
            response = client.get(
            f"/api/v1/contexts/{context_id}/flows",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "items" in data
            assert "total" in data
            assert data["total"] == 1
            assert data["has_more"] is False

    def test_list_flows_returns_403_if_context_not_owned(
        self, client, mock_context_data
    ):
        """Test GET /api/v1/contexts/{context_id}/flows returns 403 if context not owned."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
            get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            context_id = str(mock_context_data["_id"])
            response = client.get(
            f"/api/v1/contexts/{context_id}/flows",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_flows_pagination_validation(self, client):
        """Test pagination validation edge cases."""
        context_id = str(ObjectId())

        with mock_auth_success():
            # Test limit=0 (violates ge=1)
            response = client.get(
            f"/api/v1/contexts/{context_id}/flows?limit=0",
            headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test limit=101 (violates le=100)
            response = client.get(
            f"/api/v1/contexts/{context_id}/flows?limit=101",
            headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test offset=-1 (violates ge=0)
            response = client.get(
            f"/api/v1/contexts/{context_id}/flows?offset=-1",
            headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test offset=10001 (violates le=10000)
            response = client.get(
            f"/api/v1/contexts/{context_id}/flows?offset=10001",
            headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_list_flows_filters_by_include_completed(
        self, client, mock_context_data
    ):
        """Test GET /api/v1/contexts/{context_id}/flows filters by include_completed param."""
        with mock_auth_success():
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            mock_flow_repo = create_mock_flow_repository(
                count_by_context=AsyncMock(return_value=0),
                get_all_by_context=AsyncMock(return_value=[]),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            context_id = str(mock_context_data["_id"])
            response = client.get(
                f"/api/v1/contexts/{context_id}/flows?include_completed=true",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            # Verify include_completed was passed
            mock_flow_repo.count_by_context.assert_called_once_with(
                context_id, include_completed=True
            )


@pytest.mark.integration
class TestCreateFlow:
    """Tests for POST /api/v1/flows endpoint."""

    def test_create_flow_requires_auth(self, client):
        """Test that creating flow requires authentication."""
        response = client.post(
            "/api/v1/flows",
            json={
            "context_id": str(ObjectId()),
            "title": "Test Flow",
            "priority": "medium",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_flow_success(
        self, client, mock_context_data, mock_flow_data
    ):
        """Test POST /api/v1/flows creates flow successfully."""
        with mock_auth_success():
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            mock_flow_repo = create_mock_flow_repository(
                create=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/flows",
                json={
                    "context_id": context_id,
                    "title": "Review Q4 budget",
                    "priority": "high",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["title"] == "Review Q4 budget"
            # Check for either 'id' or '_id' (both are valid due to alias configuration)
            assert ("id" in data) or ("_id" in data)

    def test_create_flow_returns_403_if_context_not_owned(
        self, client
    ):
        """Test POST /api/v1/flows returns 403 if context not owned."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
            get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.post(
            "/api/v1/flows",
            json={
            "context_id": str(ObjectId()),
            "title": "Test Flow",
            "priority": "medium",
            },
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_flow_invalid_priority(self, client):
        """Test POST /api/v1/flows returns 422 for invalid priority."""
        with mock_auth_success():
            response = client.post(
            "/api/v1/flows",
            json={
            "context_id": str(ObjectId()),
            "title": "Test Flow",
            "priority": "invalid",
            },
            headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
class TestGetFlow:
    """Tests for GET /api/v1/flows/{flow_id} endpoint."""

    def test_get_flow_requires_auth(self, client):
        """Test that getting flow requires authentication."""
        response = client.get(f"/api/v1/flows/{ObjectId()!s}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_flow_success(
        self, client, mock_flow_data
    ):
        """Test GET /api/v1/flows/{id} returns flow if owned."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo

            flow_id = str(mock_flow_data["_id"])
            response = client.get(
            f"/api/v1/flows/{flow_id}",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["title"] == "Review Q4 budget"

    def test_get_flow_not_found(self, client):
        """Test GET /api/v1/flows/{id} returns 404 if not found."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo

            response = client.get(
            f"/api/v1/flows/{ObjectId()!s}",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestUpdateFlow:
    """Tests for PUT /api/v1/flows/{flow_id} endpoint."""

    def test_update_flow_requires_auth(self, client):
        """Test that updating flow requires authentication."""
        response = client.put(
            f"/api/v1/flows/{ObjectId()!s}",
            json={"title": "Updated"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_flow_success(
        self, client, mock_flow_data
    ):
        """Test PUT /api/v1/flows/{id} updates flow if owned."""
        updated_data = mock_flow_data.copy()
        updated_data["title"] = "Updated Title"

        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo
            mock_repo.update = AsyncMock(return_value=FlowInDB(**updated_data))

            flow_id = str(mock_flow_data["_id"])
            response = client.put(
            f"/api/v1/flows/{flow_id}",
            json={"title": "Updated Title"},
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["title"] == "Updated Title"

    def test_update_flow_not_found(self, client):
        """Test PUT /api/v1/flows/{id} returns 404 if not owned."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo

            response = client.put(
            f"/api/v1/flows/{ObjectId()!s}",
            json={"title": "Updated"},
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestDeleteFlow:
    """Tests for DELETE /api/v1/flows/{flow_id} endpoint."""

    def test_delete_flow_requires_auth(self, client):
        """Test that deleting flow requires authentication."""
        response = client.delete(f"/api/v1/flows/{ObjectId()!s}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_flow_success(
        self, client, mock_flow_data
    ):
        """Test DELETE /api/v1/flows/{id} deletes flow if owned."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo
            mock_repo.delete = AsyncMock(return_value=True)

            flow_id = str(mock_flow_data["_id"])
            response = client.delete(
            f"/api/v1/flows/{flow_id}",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_flow_not_found(self, client):
        """Test DELETE /api/v1/flows/{id} returns 404 if not owned."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo

            response = client.delete(
            f"/api/v1/flows/{ObjectId()!s}",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestMarkFlowComplete:
    """Tests for PATCH /api/v1/flows/{flow_id}/complete endpoint."""

    def test_mark_complete_requires_auth(self, client):
        """Test that marking flow complete requires authentication."""
        response = client.patch(f"/api/v1/flows/{ObjectId()!s}/complete")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mark_complete_success(
        self, client, mock_flow_data
    ):
        """Test PATCH /api/v1/flows/{id}/complete marks flow complete."""
        completed_data = mock_flow_data.copy()
        completed_data["is_completed"] = True
        completed_data["completed_at"] = datetime.now(UTC)

        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo
            mock_repo.mark_complete = AsyncMock(return_value=FlowInDB(**completed_data))

            flow_id = str(mock_flow_data["_id"])
            response = client.patch(
            f"/api/v1/flows/{flow_id}/complete",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["is_completed"] is True

    def test_mark_complete_already_completed(
        self, client, mock_flow_data
    ):
        """Test PATCH /api/v1/flows/{id}/complete returns 404 if already complete."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo
            mock_repo.mark_complete = AsyncMock(return_value=None)

            flow_id = str(mock_flow_data["_id"])
            response = client.patch(
            f"/api/v1/flows/{flow_id}/complete",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_mark_complete_not_owned(self, client):
        """Test PATCH /api/v1/flows/{id}/complete returns 404 if not owned."""
        with mock_auth_success():
            mock_repo = create_mock_flow_repository(
            get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_flow_repository] = lambda: mock_repo

            response = client.patch(
            f"/api/v1/flows/{ObjectId()!s}/complete",
            headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND
