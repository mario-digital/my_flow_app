"""Unit tests for main FastAPI application."""

import pytest
from fastapi.testclient import TestClient

from src.config import settings
from src.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.mark.unit
def test_app_creation():
    """Test that the FastAPI app can be created."""
    assert app is not None
    assert app.title == settings.PROJECT_NAME
    assert app.version == settings.VERSION


@pytest.mark.unit
def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "mongodb_connected" in data
    assert "timestamp" in data


@pytest.mark.unit
def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert settings.PROJECT_NAME in data["message"]
    assert settings.API_V1_STR in data["message"]
