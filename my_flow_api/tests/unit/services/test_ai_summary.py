"""Unit tests for AI context summary generation."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest

from src.models.flow import FlowInDB, FlowPriority
from src.models.summary import ContextSummary
from src.services.ai_service import AIService
from src.services.cache_service import summary_cache


@pytest.fixture(autouse=True)
async def clear_cache():
    """Automatically clear cache before each test."""
    await summary_cache.clear()
    yield
    await summary_cache.clear()


@pytest.fixture
def mock_flow_repo():
    """Mock FlowRepository for testing."""
    return AsyncMock()


@pytest.fixture
def mock_ai_service(monkeypatch):
    """Mock AIService with mocked AI completion call."""
    service = AIService()

    # Mock the AI completion call
    async def mock_completion(messages, temperature=0.7, max_tokens=150):
        return "You have 2 incomplete flows in this context. Keep up the good work!"

    monkeypatch.setattr(service, "_call_ai_completion", AsyncMock(side_effect=mock_completion))
    return service


@pytest.fixture
def sample_flows():
    """Sample flows for testing."""
    now = datetime.now(UTC)
    return [
        FlowInDB(
            id="f1",
            context_id="ctx123",
            user_id="user456",
            title="Task 1",
            description="First task",
            priority=FlowPriority.HIGH,
            is_completed=False,
            created_at=now,
            updated_at=now,
        ),
        FlowInDB(
            id="f2",
            context_id="ctx123",
            user_id="user456",
            title="Task 2",
            description="Second task",
            priority=FlowPriority.MEDIUM,
            is_completed=False,
            created_at=now,
            updated_at=now,
        ),
        FlowInDB(
            id="f3",
            context_id="ctx123",
            user_id="user456",
            title="Task 3",
            description="Third task",
            priority=FlowPriority.LOW,
            is_completed=True,
            created_at=now,
            updated_at=now,
            completed_at=now,
        ),
    ]


@pytest.mark.asyncio
async def test_generate_summary_with_flows(mock_ai_service, mock_flow_repo, sample_flows):
    """Test summary generation with mock flows."""
    # Arrange
    context_id = "ctx123"
    user_id = "user456"
    mock_flow_repo.get_all_by_context.return_value = sample_flows

    # Act
    summary = await mock_ai_service.generate_context_summary(context_id, user_id, mock_flow_repo)

    # Assert
    assert isinstance(summary, ContextSummary)
    assert summary.context_id == context_id
    assert summary.incomplete_flows_count == 2
    assert summary.completed_flows_count == 1
    assert len(summary.summary_text) > 0
    assert summary.last_activity is not None
    assert len(summary.top_priorities) <= 3
    # High priority flow should be in top priorities
    assert len(summary.top_priorities) == 1
    assert summary.top_priorities[0].priority == FlowPriority.HIGH


@pytest.mark.asyncio
async def test_summary_caching(mock_ai_service, mock_flow_repo, sample_flows):
    """Test that summaries are cached for 5 minutes."""
    context_id = "ctx123"
    user_id = "user456"
    mock_flow_repo.get_all_by_context.return_value = sample_flows

    # First call - should generate summary
    summary1 = await mock_ai_service.generate_context_summary(context_id, user_id, mock_flow_repo)

    # Second call - should hit cache
    summary2 = await mock_ai_service.generate_context_summary(context_id, user_id, mock_flow_repo)

    # Assert AI was only called once (cached on second call)
    assert mock_ai_service._call_ai_completion.call_count == 1
    assert summary1.summary_text == summary2.summary_text
    assert summary1.incomplete_flows_count == summary2.incomplete_flows_count


@pytest.mark.asyncio
async def test_summary_with_no_flows(mock_ai_service, mock_flow_repo):
    """Test summary generation when context has no flows."""
    mock_flow_repo.get_all_by_context.return_value = []

    summary = await mock_ai_service.generate_context_summary("ctx123", "user456", mock_flow_repo)

    assert summary.incomplete_flows_count == 0
    assert summary.completed_flows_count == 0
    assert "no flows" in summary.summary_text.lower()
    assert summary.last_activity is None
    assert len(summary.top_priorities) == 0


@pytest.mark.asyncio
async def test_summary_error_handling(mock_ai_service, mock_flow_repo, sample_flows):
    """Test fallback summary when AI call fails."""
    mock_flow_repo.get_all_by_context.return_value = sample_flows

    # Mock AI completion to raise exception
    mock_ai_service._call_ai_completion = AsyncMock(side_effect=Exception("AI error"))

    summary = await mock_ai_service.generate_context_summary("ctx123", "user456", mock_flow_repo)

    # Should return fallback summary
    assert summary.incomplete_flows_count == 2
    assert summary.completed_flows_count == 1
    assert len(summary.summary_text) > 0
    assert "incomplete flows" in summary.summary_text.lower()


@pytest.mark.asyncio
async def test_summary_top_priorities_sorting(mock_ai_service, mock_flow_repo):
    """Test that top priorities are sorted correctly (high priority only)."""
    now = datetime.now(UTC)
    flows = [
        FlowInDB(
            id=f"f{i}",
            context_id="ctx123",
            user_id="user456",
            title=f"High Priority Task {i}",
            priority=FlowPriority.HIGH,
            is_completed=False,
            created_at=now,
            updated_at=now,
        )
        for i in range(5)
    ]

    mock_flow_repo.get_all_by_context.return_value = flows

    summary = await mock_ai_service.generate_context_summary("ctx123", "user456", mock_flow_repo)

    # Should only return top 3 high-priority flows
    assert len(summary.top_priorities) == 3
    assert all(f.priority == FlowPriority.HIGH for f in summary.top_priorities)


@pytest.mark.asyncio
async def test_summary_validates_required_inputs(mock_ai_service, mock_flow_repo):
    """Test that summary generation validates required inputs."""
    # Test missing context_id
    with pytest.raises(ValueError, match="context_id is required"):
        await mock_ai_service.generate_context_summary("", "user456", mock_flow_repo)

    # Test missing user_id
    with pytest.raises(ValueError, match="user_id is required"):
        await mock_ai_service.generate_context_summary("ctx123", "", mock_flow_repo)
