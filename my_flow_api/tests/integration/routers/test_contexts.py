"""Integration tests for Context API routes."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from bson import ObjectId
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app
from src.models.context import ContextInDB
from src.routers.contexts import get_context_repository, get_flow_repository
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


@pytest.mark.integration
class TestListContexts:
    """Tests for GET /api/v1/contexts endpoint."""

    def test_list_contexts_requires_auth(self, client):
        """Test that listing contexts requires authentication."""
        response = client.get("/api/v1/contexts")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_contexts_returns_paginated_response(
        self, client, mock_context_data
    ):
        """Test GET /api/v1/contexts returns paginated response."""
        with mock_auth_success():
            # Create mock repository with specific method responses
            mock_repo = create_mock_context_repository(
                count_by_user=AsyncMock(return_value=1),
                get_all_by_user=AsyncMock(return_value=[ContextInDB(**mock_context_data)]),
            )

            # Override dependency to return our mock
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.get(
                "/api/v1/contexts",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "items" in data
            assert "total" in data
            assert "limit" in data
            assert "offset" in data
            assert "has_more" in data
            assert data["total"] == 1
            assert data["limit"] == 50
            assert data["offset"] == 0
            assert data["has_more"] is False

    def test_list_contexts_pagination_limit_validation(self, client):
        """Test pagination limit validation (ge=1, le=100)."""
        with mock_auth_success():
            # Test limit=0 (violates ge=1)
            response = client.get(
                "/api/v1/contexts?limit=0",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test limit=101 (violates le=100)
            response = client.get(
                "/api/v1/contexts?limit=101",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test limit=1 (boundary test - should pass)
            mock_repo = create_mock_context_repository(
                count_by_user=AsyncMock(return_value=0),
                get_all_by_user=AsyncMock(return_value=[]),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.get(
                "/api/v1/contexts?limit=1",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_200_OK

    def test_list_contexts_pagination_offset_validation(self, client):
        """Test pagination offset validation (ge=0, le=10000)."""
        with mock_auth_success():
            # Test offset=-1 (violates ge=0)
            response = client.get(
                "/api/v1/contexts?offset=-1",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test offset=10001 (violates le=10000)
            response = client.get(
                "/api/v1/contexts?offset=10001",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_list_contexts_offset_beyond_total(self, client):
        """Test offset beyond total returns empty list (no error)."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                count_by_user=AsyncMock(return_value=5),
                get_all_by_user=AsyncMock(return_value=[]),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.get(
                "/api/v1/contexts?offset=100",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data["items"]) == 0
            assert data["total"] == 5


@pytest.mark.integration
class TestCreateContext:
    """Tests for POST /api/v1/contexts endpoint."""

    def test_create_context_requires_auth(self, client):
        """Test that creating context requires authentication."""
        response = client.post(
            "/api/v1/contexts",
            json={"name": "Work", "color": "#3B82F6", "icon": "💼"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_context_success(
        self, client, mock_context_data
    ):
        """Test POST /api/v1/contexts creates context successfully."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                create=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.post(
                "/api/v1/contexts",
                json={"name": "Work", "color": "#3B82F6", "icon": "💼"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["name"] == "Work"
            # Check for either 'id' or '_id' (both are valid due to alias configuration)
            assert ("id" in data) or ("_id" in data)

    def test_create_context_invalid_color(self, client):
        """Test POST /api/v1/contexts returns 422 for invalid color format."""
        with mock_auth_success():
            response = client.post(
                "/api/v1/contexts",
                json={"name": "Work", "color": "invalid", "icon": "💼"},
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
class TestGetContext:
    """Tests for GET /api/v1/contexts/{context_id} endpoint."""

    def test_get_context_requires_auth(self, client):
        """Test that getting context requires authentication."""
        response = client.get("/api/v1/contexts/507f1f77bcf86cd799439011")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_context_success(
        self, client, mock_context_data
    ):
        """Test GET /api/v1/contexts/{id} returns context if owned."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            context_id = str(mock_context_data["_id"])
            response = client.get(
                f"/api/v1/contexts/{context_id}",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["name"] == "Work"

    def test_get_context_not_found(self, client):
        """Test GET /api/v1/contexts/{id} returns 404 if not found."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.get(
                "/api/v1/contexts/507f1f77bcf86cd799439011",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestUpdateContext:
    """Tests for PUT /api/v1/contexts/{context_id} endpoint."""

    def test_update_context_requires_auth(self, client):
        """Test that updating context requires authentication."""
        response = client.put(
            "/api/v1/contexts/507f1f77bcf86cd799439011",
            json={"name": "Updated"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_context_success(
        self, client, mock_context_data
    ):
        """Test PUT /api/v1/contexts/{id} updates context if owned."""
        updated_data = mock_context_data.copy()
        updated_data["name"] = "Updated Work"

        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
                update=AsyncMock(return_value=ContextInDB(**updated_data)),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            context_id = str(mock_context_data["_id"])
            response = client.put(
                f"/api/v1/contexts/{context_id}",
                json={"name": "Updated Work"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["name"] == "Updated Work"

    def test_update_context_not_found(self, client):
        """Test PUT /api/v1/contexts/{id} returns 404 if not owned."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.put(
                "/api/v1/contexts/507f1f77bcf86cd799439011",
                json={"name": "Updated"},
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestDeleteContext:
    """Tests for DELETE /api/v1/contexts/{context_id} endpoint."""

    def test_delete_context_requires_auth(self, client):
        """Test that deleting context requires authentication."""
        response = client.delete("/api/v1/contexts/507f1f77bcf86cd799439011")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_context_cascades_to_flows(
        self, client, mock_context_data
    ):
        """Test DELETE /api/v1/contexts/{id} deletes context and cascades to flows."""
        with mock_auth_success():
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
                delete=AsyncMock(return_value=True),
            )
            mock_flow_repo = create_mock_flow_repository(
                delete_by_context_id=AsyncMock(return_value=10),
            )

            app.dependency_overrides[get_context_repository] = lambda: mock_context_repo
            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            context_id = str(mock_context_data["_id"])
            response = client.delete(
                f"/api/v1/contexts/{context_id}",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_204_NO_CONTENT
            # Verify bulk delete was called
            mock_flow_repo.delete_by_context_id.assert_called_once()

    def test_delete_context_not_found(self, client):
        """Test DELETE /api/v1/contexts/{id} returns 404 if not owned."""
        with mock_auth_success():
            mock_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=None),
            )
            app.dependency_overrides[get_context_repository] = lambda: mock_repo

            response = client.delete(
                "/api/v1/contexts/507f1f77bcf86cd799439011",
                headers={"Authorization": "Bearer valid-token"},
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND
