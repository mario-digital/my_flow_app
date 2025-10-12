"""Integration tests for transition warnings endpoint."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_warnings_endpoint(
    async_client: AsyncClient,
    test_db,
    mock_auth_user,
):
    """Test GET /api/v1/transitions/warnings/{context_id} endpoint."""
    # Setup: Create context and flows in test DB
    context_id = "ctx-work"
    user_id = mock_auth_user["user_id"]

    # Create test context
    await test_db.contexts.insert_one(
        {
            "id": context_id,
            "user_id": user_id,
            "name": "Work",
            "emoji": "💼",
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )

    # Create test flows
    flows = [
        {
            "id": "flow-1",
            "user_id": user_id,
            "context_id": context_id,
            "title": "Incomplete Task",
            "priority": "high",
            "is_completed": False,
            "due_date": None,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        },
        {
            "id": "flow-2",
            "user_id": user_id,
            "context_id": context_id,
            "title": "Completed Task",
            "priority": "medium",
            "is_completed": True,
            "due_date": None,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        },
    ]
    await test_db.flows.insert_many(flows)

    response = await async_client.get(f"/api/v1/transitions/warnings/{context_id}")

    assert response.status_code == 200
    data = response.json()
    assert "context_id" in data
    assert "incomplete_count" in data
    assert "overdue_count" in data
    assert "overdue_flows" in data
    assert isinstance(data["overdue_flows"], list)
    assert data["context_id"] == context_id
    assert data["incomplete_count"] == 1  # Only flow-1 is incomplete


@pytest.mark.asyncio
async def test_warnings_unauthorized_access(async_client: AsyncClient):
    """Test endpoint requires authentication."""
    # Call without auth header
    response = await async_client.get(
        "/api/v1/transitions/warnings/ctx-work",
        headers={},  # No Authorization header
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_warnings_with_overdue_flows(
    async_client: AsyncClient,
    test_db,
    mock_auth_user,
):
    """Test warnings include overdue flow details."""
    # Setup: Create overdue flow in test DB
    context_id = "ctx-work-overdue"
    user_id = mock_auth_user["user_id"]
    overdue_date = datetime.now(UTC) - timedelta(days=2)

    # Create test context
    await test_db.contexts.insert_one(
        {
            "id": context_id,
            "user_id": user_id,
            "name": "Work",
            "emoji": "💼",
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )

    # Create overdue flow
    await test_db.flows.insert_one(
        {
            "id": "flow-overdue",
            "user_id": user_id,
            "context_id": context_id,
            "title": "Overdue Task",
            "priority": "high",
            "is_completed": False,
            "due_date": overdue_date,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )

    response = await async_client.get(f"/api/v1/transitions/warnings/{context_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["overdue_count"] > 0
    assert len(data["overdue_flows"]) == data["overdue_count"]

    # Verify overdue flow structure
    overdue_flow = data["overdue_flows"][0]
    assert "id" in overdue_flow
    assert "title" in overdue_flow
    assert "due_date" in overdue_flow
    assert overdue_flow["id"] == "flow-overdue"
    assert overdue_flow["title"] == "Overdue Task"

