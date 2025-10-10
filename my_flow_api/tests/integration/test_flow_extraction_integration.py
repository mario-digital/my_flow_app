"""Integration tests for flow extraction with database operations."""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from src import config
from src.models.flow import FlowCreate, FlowPriority
from src.services.ai_service import AIService


@pytest.mark.asyncio
async def test_extract_and_create_flows_e2e(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test full workflow: extraction → validation → ready for database insertion.

    Note: This test mocks AI responses and verifies the extraction logic.
    Actual database insertion is tested in repository tests.
    """
    # Setup AIService with OpenAI
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "gpt-4")

    # Mock AsyncOpenAI
    mock_client = AsyncMock()
    monkeypatch.setattr("src.services.ai_service.AsyncOpenAI", lambda **kwargs: mock_client)

    ai_service = AIService()
    ai_service.openai_client = mock_client

    # Mock successful AI response with 3 flows
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content=json.dumps(
                    {
                        "tasks": [
                            {
                                "title": "Finish presentation",
                                "description": "Due Monday morning",
                                "priority": "high",
                            },
                            {
                                "title": "Call client",
                                "description": "Discuss project status",
                                "priority": "medium",
                            },
                            {"title": "Book flight to SF", "priority": "medium"},
                        ]
                    }
                )
            )
        )
    ]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    # Step 1: Extract flows from conversation
    conversation = """
    User: I have a busy week ahead.
    Assistant: What do you need to get done?
    User: I need to finish the presentation for Monday,
          call the client about the project,
          and book a flight to San Francisco.
    """

    flows = await ai_service.extract_flows_from_text(conversation, "work-context-id")

    # Step 2: Verify extracted flows
    assert len(flows) == 3

    # Verify first flow
    assert isinstance(flows[0], FlowCreate)
    assert flows[0].title == "Finish presentation"
    assert flows[0].description == "Due Monday morning"
    assert flows[0].priority == FlowPriority.HIGH
    assert flows[0].context_id == "work-context-id"
    assert flows[0].reminder_enabled is False
    assert flows[0].due_date is None

    # Verify second flow
    assert flows[1].title == "Call client"
    assert flows[1].description == "Discuss project status"
    assert flows[1].priority == FlowPriority.MEDIUM

    # Verify third flow
    assert flows[2].title == "Book flight to SF"
    assert flows[2].priority == FlowPriority.MEDIUM

    # Step 3: Verify flows are ready for database insertion
    # All FlowCreate objects can be converted to dict for repository
    for flow in flows:
        data = flow.model_dump()
        assert "context_id" in data
        assert "title" in data
        assert "priority" in data
        assert data["context_id"] == "work-context-id"


@pytest.mark.asyncio
async def test_extraction_failure_graceful_handling(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that AI extraction failures don't create partial flows."""
    # Setup AIService with OpenAI
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    # Mock AsyncOpenAI
    mock_client = AsyncMock()
    monkeypatch.setattr("src.services.ai_service.AsyncOpenAI", lambda **kwargs: mock_client)

    ai_service = AIService()
    ai_service.openai_client = mock_client

    # Mock AI returning malformed JSON
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Not valid JSON at all"))]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    # Attempt extraction
    flows = await ai_service.extract_flows_from_text("Some conversation", "test-context")

    # Should return empty list, not raise exception or create partial data
    assert flows == []
    assert isinstance(flows, list)


@pytest.mark.asyncio
async def test_duplicate_flow_extraction(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that same conversation twice creates duplicate flows (expected behavior)."""
    # Setup AIService with OpenAI
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    # Mock AsyncOpenAI
    mock_client = AsyncMock()
    monkeypatch.setattr("src.services.ai_service.AsyncOpenAI", lambda **kwargs: mock_client)

    ai_service = AIService()
    ai_service.openai_client = mock_client

    # Mock AI response
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content=json.dumps({"tasks": [{"title": "Buy milk", "priority": "low"}]})
            )
        )
    ]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    conversation = "I need to buy milk."

    # First extraction
    flows1 = await ai_service.extract_flows_from_text(conversation, "shopping-context")
    assert len(flows1) == 1

    # Second extraction (same conversation)
    flows2 = await ai_service.extract_flows_from_text(conversation, "shopping-context")
    assert len(flows2) == 1

    # Both should have same content but are separate objects
    assert flows1[0].title == flows2[0].title
    assert flows1[0] is not flows2[0]  # Different objects


@pytest.mark.asyncio
async def test_extraction_with_mixed_valid_invalid_tasks(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that valid flows are extracted even if some tasks are invalid."""
    # Setup AIService
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    mock_client = AsyncMock()
    monkeypatch.setattr("src.services.ai_service.AsyncOpenAI", lambda **kwargs: mock_client)

    ai_service = AIService()
    ai_service.openai_client = mock_client

    # Mock AI response with mix of valid and invalid tasks
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content=json.dumps(
                    {
                        "tasks": [
                            {"title": "Valid task 1", "priority": "high"},
                            {"description": "Missing title", "priority": "medium"},  # Invalid
                            {"title": "Valid task 2", "priority": "low"},
                            {
                                "title": "Valid task 3",
                                "priority": "INVALID_PRIORITY",
                            },  # Invalid priority
                        ]
                    }
                )
            )
        )
    ]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    flows = await ai_service.extract_flows_from_text("Some conversation", "test-context")

    # Should extract 3 valid tasks (invalid priority defaults to medium)
    assert len(flows) == 3
    assert flows[0].title == "Valid task 1"
    assert flows[1].title == "Valid task 2"
    assert flows[2].title == "Valid task 3"
    assert flows[2].priority == FlowPriority.MEDIUM  # Invalid priority defaulted


@pytest.mark.asyncio
async def test_extraction_respects_context_id(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that all extracted flows have correct context_id."""
    # Setup AIService with Anthropic
    monkeypatch.setattr(config.settings, "AI_PROVIDER", "anthropic")
    monkeypatch.setattr(config.settings, "ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setattr(config.settings, "AI_MODEL", "claude-3-5-sonnet-20241022")

    mock_client = AsyncMock()
    monkeypatch.setattr("src.services.ai_service.AsyncAnthropic", lambda **kwargs: mock_client)

    ai_service = AIService()
    ai_service.anthropic_client = mock_client

    # Mock Anthropic response
    mock_response = MagicMock()
    mock_response.content = [
        MagicMock(
            text=json.dumps(
                {
                    "tasks": [
                        {"title": "Task A", "priority": "high"},
                        {"title": "Task B", "priority": "medium"},
                    ]
                }
            )
        )
    ]
    mock_client.messages.create = AsyncMock(return_value=mock_response)

    # Extract with specific context_id
    specific_context = "personal-goals-2025"
    flows = await ai_service.extract_flows_from_text("Some tasks", specific_context)

    # All flows should have the correct context_id
    assert len(flows) == 2
    for flow in flows:
        assert flow.context_id == specific_context


@pytest.mark.asyncio
async def test_extraction_security_fields_set_correctly(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that security-related fields are set correctly for auto-extracted flows."""
    # Setup AIService
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    mock_client = AsyncMock()
    monkeypatch.setattr("src.services.ai_service.AsyncOpenAI", lambda **kwargs: mock_client)

    ai_service = AIService()
    ai_service.openai_client = mock_client

    # Mock response
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content=json.dumps({"tasks": [{"title": "Test task", "priority": "medium"}]})
            )
        )
    ]
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    flows = await ai_service.extract_flows_from_text("Test", "test-context")

    assert len(flows) == 1
    # Auto-extracted flows should have these security defaults
    assert flows[0].reminder_enabled is False  # No automatic reminders
    assert flows[0].due_date is None  # No due date extraction in Story 3.3
