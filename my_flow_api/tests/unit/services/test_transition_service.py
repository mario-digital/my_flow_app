"""Unit tests for TransitionService."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from src.models.flow import FlowInDB, FlowResponse
from src.services.transition_service import TransitionService


@pytest.fixture
def mock_flow_repo():
    """Create mock FlowRepository."""
    return AsyncMock()


@pytest.fixture
def mock_context_repo():
    """Create mock ContextRepository."""
    return AsyncMock()


@pytest.fixture
def transition_service(mock_flow_repo, mock_context_repo):
    """Create TransitionService with mock repositories."""
    return TransitionService(mock_flow_repo, mock_context_repo)


def create_flow(
    flow_id: str,
    title: str,
    priority: str = "medium",
    is_completed: bool = False,
    due_date: datetime | None = None,
    context_id: str = "ctx-test",
    user_id: str = "user123",
) -> FlowResponse:
    """Helper to create FlowResponse for testing."""
    now = datetime.now(UTC)
    return FlowResponse(
        id=flow_id,
        title=title,
        priority=priority,
        is_completed=is_completed,
        due_date=due_date,
        context_id=context_id,
        user_id=user_id,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_no_incomplete_flows(transition_service, mock_flow_repo):
    """Test suggestions when no incomplete flows exist."""
    # Mock: No flows in either context
    mock_flow_repo.get_all_by_context.return_value = []

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    assert result.from_context == "ctx-work"
    assert result.to_context == "ctx-personal"
    assert len(result.warnings) == 0
    assert "No pending flows" in result.suggestions[0]
    assert len(result.urgent_flows) == 0


@pytest.mark.asyncio
async def test_incomplete_flows_in_source_context(transition_service, mock_flow_repo):
    """Test warnings when source context has incomplete flows."""
    # Mock: 3 incomplete flows in source, none in target
    source_flows = [
        create_flow("f1", "Task 1", priority="high"),
        create_flow("f2", "Task 2", priority="medium"),
        create_flow("f3", "Task 3", priority="low"),
    ]

    # Convert to InDB format for mock return
    mock_flow_repo.get_all_by_context.side_effect = [
        [FlowInDB(**flow.model_dump()) for flow in source_flows],  # Source context
        [],  # Target context
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    assert len(result.warnings) > 0
    assert "3 incomplete flows" in result.warnings[0]
    assert "1 of them are high priority" in result.warnings[1]


@pytest.mark.asyncio
async def test_urgent_flows_due_today(transition_service, mock_flow_repo):
    """Test detection of flows due today."""
    # Mock: Flow due today in target context
    due_today = datetime.now(UTC) + timedelta(hours=3)

    target_flows = [create_flow("f1", "Urgent Task", priority="high", due_date=due_today)]

    mock_flow_repo.get_all_by_context.side_effect = [
        [],  # Source context
        [FlowInDB(**flow.model_dump()) for flow in target_flows],  # Target context
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    assert len(result.urgent_flows) == 1
    assert result.urgent_flows[0].id == "f1"
    assert "due today" in result.suggestions[0]


@pytest.mark.asyncio
async def test_overdue_flows(transition_service, mock_flow_repo):
    """Test detection of overdue flows."""
    # Mock: Overdue flow in target context
    overdue = datetime.now(UTC) - timedelta(days=2)

    target_flows = [create_flow("f1", "Overdue Task", priority="high", due_date=overdue)]

    mock_flow_repo.get_all_by_context.side_effect = [
        [],  # Source context
        [FlowInDB(**flow.model_dump()) for flow in target_flows],  # Target context
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    assert len(result.urgent_flows) == 1
    assert "overdue" in result.suggestions[0]


@pytest.mark.asyncio
async def test_high_priority_without_due_date(transition_service, mock_flow_repo):
    """Test urgent flows with high priority but no due date."""
    target_flows = [create_flow("f1", "Important Task", priority="high", due_date=None)]

    mock_flow_repo.get_all_by_context.side_effect = [
        [],  # Source context
        [FlowInDB(**flow.model_dump()) for flow in target_flows],  # Target context
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    assert len(result.urgent_flows) == 1
    assert "high-priority" in result.suggestions[0]


@pytest.mark.asyncio
async def test_completed_flows_ignored(transition_service, mock_flow_repo):
    """Test that completed flows are not included in urgent flows."""
    # Completed flow should not appear in urgent flows
    target_flows = [create_flow("f1", "Completed Task", priority="high", is_completed=True)]

    mock_flow_repo.get_all_by_context.side_effect = [
        [],  # Source context
        [FlowInDB(**flow.model_dump()) for flow in target_flows],  # Target context
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    # Completed flows are filtered out by get_all_by_context (include_completed=False)
    # So we expect no urgent flows and "No pending flows" message
    assert len(result.urgent_flows) == 0


@pytest.mark.asyncio
async def test_mixed_priorities_and_due_dates(transition_service, mock_flow_repo):
    """Test complex scenario with multiple priorities and due dates."""
    now = datetime.now(UTC)
    due_today = now + timedelta(hours=2)
    overdue = now - timedelta(days=1)
    due_soon = now + timedelta(days=2)

    target_flows = [
        create_flow("f1", "Overdue High", priority="high", due_date=overdue),
        create_flow("f2", "Due Today High", priority="high", due_date=due_today),
        create_flow("f3", "Due Soon High", priority="high", due_date=due_soon),
        create_flow("f4", "No Date High", priority="high", due_date=None),
        create_flow("f5", "Medium Priority", priority="medium", due_date=None),
    ]

    mock_flow_repo.get_all_by_context.side_effect = [
        [],  # Source context
        [FlowInDB(**flow.model_dump()) for flow in target_flows],  # Target context
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    # Should have 4 urgent flows (all except medium priority)
    assert len(result.urgent_flows) == 4
    # Should have overdue and due today suggestions
    assert any("overdue" in s for s in result.suggestions)
    assert any("due today" in s for s in result.suggestions)


@pytest.mark.asyncio
async def test_single_incomplete_flow_warning(transition_service, mock_flow_repo):
    """Test warning message with singular flow count."""
    source_flows = [create_flow("f1", "Single Task", priority="medium")]

    mock_flow_repo.get_all_by_context.side_effect = [
        [FlowInDB(**flow.model_dump()) for flow in source_flows],  # Source
        [],  # Target
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    # Should use singular form
    assert "1 incomplete flow" in result.warnings[0]
    assert "flows" not in result.warnings[0] or "1 incomplete flow" in result.warnings[0]


@pytest.mark.asyncio
async def test_urgent_flow_sorting(transition_service, mock_flow_repo):
    """Test that urgent flows are sorted by due date (overdue first)."""
    now = datetime.now(UTC)
    date1 = now + timedelta(hours=1)
    date2 = now - timedelta(days=2)  # Most overdue
    date3 = now - timedelta(days=1)  # Less overdue
    date4 = now + timedelta(hours=5)

    target_flows = [
        create_flow("f1", "Due Soon 1", priority="high", due_date=date1),
        create_flow("f2", "Most Overdue", priority="high", due_date=date2),
        create_flow("f3", "Less Overdue", priority="high", due_date=date3),
        create_flow("f4", "Due Soon 2", priority="high", due_date=date4),
    ]

    mock_flow_repo.get_all_by_context.side_effect = [
        [],  # Source context
        [FlowInDB(**flow.model_dump()) for flow in target_flows],  # Target
    ]

    result = await transition_service.get_transition_suggestions(
        from_context_id="ctx-work",
        to_context_id="ctx-personal",
        user_id="user123",
    )

    # Should be sorted: most overdue first
    assert result.urgent_flows[0].id == "f2"
    assert result.urgent_flows[1].id == "f3"
