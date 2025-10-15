"""Integration tests for Conversation API routes."""

import contextlib
import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app
from src.models.context import ContextInDB
from src.models.conversation import Message, MessageRole
from src.models.flow import FlowCreate, FlowInDB, FlowPriority
from src.routers.conversations import get_conversation_repository, get_flow_repository
from src.utils.exceptions import AIServiceError
from tests.integration.routers.conftest import (
    create_mock_context_repository,
    create_mock_conversation_repository,
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
    """Mock flow data for extracted flow."""
    return {
        "_id": ObjectId(),
        "title": "Book flight",
        "description": "Book flight to NYC",
        "context_id": str(mock_context_data["_id"]),
        "user_id": "test_user_123",
        "priority": "high",
        "is_completed": False,
        "reminder_enabled": True,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }


@pytest.fixture
def chat_messages():
    """Sample chat messages."""
    return [Message(role=MessageRole.USER, content="I need to book a flight and call the client")]


@pytest.fixture
def mock_ai_service():
    """Mock AIService with streaming and extraction."""
    with patch("src.routers.conversations.AIService") as mock_service_class:
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        yield mock_service


@pytest.mark.integration
class TestStreamChat:
    """Tests for POST /api/v1/conversations/stream endpoint."""

    def test_stream_chat_requires_auth(self, client, mock_context_data, chat_messages):
        """Test that streaming requires authentication (AC: 2)."""
        context_id = str(mock_context_data["_id"])
        response = client.post(
            "/api/v1/conversations/stream",
            json={
                "context_id": context_id,
                "messages": [{"role": "user", "content": "Hello"}],
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_stream_chat_validates_context_ownership(
        self, client, mock_context_data, chat_messages
    ):
        """Test that user must own the context (AC: 2)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context repo to return None (context not found or not owned)
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=None),
            )
            mock_flow_repo = create_mock_flow_repository()
            mock_flow_repo.context_repo = mock_context_repo

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "Hello"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Should fail with 404 because context not found/owned
            assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_stream_chat_success_streams_tokens(
        self, client, mock_context_data, chat_messages, mock_ai_service, mock_flow_data
    ):
        """Test successful SSE streaming with token-by-token response (AC: 1, 3)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context ownership verification
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )

            # Mock flow repository with no flows created
            mock_flow_repo = create_mock_flow_repository(
                create=AsyncMock(return_value=FlowInDB(**mock_flow_data)),
            )
            mock_flow_repo.context_repo = mock_context_repo

            # Mock conversation repository
            mock_conv_repo = create_mock_conversation_repository()

            # Mock AI service to stream tokens
            async def mock_stream(
                messages,
                context_id,
                tools=None,
                available_flows=None,
                is_context_switch=False,
                context_name=None,
            ):
                """Mock async generator for streaming."""
                for token in ["I'll", " help", " you", " with", " that"]:
                    yield {"type": "text", "content": token}

            mock_ai_service.stream_chat_response = mock_stream
            mock_ai_service.extract_flows_from_text = AsyncMock(return_value=[])

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo
            app.dependency_overrides[get_conversation_repository] = lambda: mock_conv_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "Hello"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Verify SSE response
            assert response.status_code == status.HTTP_200_OK
            assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

            # Read SSE events
            events = []
            for line in response.iter_lines():
                if line:
                    events.append(line)

            # Parse JSON events
            json_events = []
            for line in events:
                if line.startswith("data: "):
                    with contextlib.suppress(json.JSONDecodeError):
                        json_events.append(json.loads(line[6:]))

            # Verify we got assistant_token events
            token_events = [e for e in json_events if e.get("type") == "assistant_token"]
            assert len(token_events) > 0  # Should have received tokens

            # Verify done event
            done_events = [e for e in json_events if e.get("type") == "done"]
            assert len(done_events) == 1

    def test_stream_chat_extracts_and_creates_flows(
        self, client, mock_context_data, chat_messages, mock_ai_service, mock_flow_data
    ):
        """Test that flows are extracted and created after streaming (AC: 1, 4)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context ownership verification
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )

            # Mock flow repository to track flow creation
            created_flow = FlowInDB(**mock_flow_data)
            mock_flow_repo = create_mock_flow_repository(
                create=AsyncMock(return_value=created_flow),
            )
            mock_flow_repo.context_repo = mock_context_repo

            # Mock conversation repository
            mock_conv_repo = create_mock_conversation_repository()

            # Mock AI service to stream tokens and extract flows
            async def mock_stream(
                messages,
                context_id,
                tools=None,
                available_flows=None,
                is_context_switch=False,
                context_name=None,
            ):
                """Mock async generator for streaming."""
                for token in ["Sure", ", I'll", " help"]:
                    yield {"type": "text", "content": token}

            mock_extracted_flow = FlowCreate(
                context_id=str(mock_context_data["_id"]),
                title="Book flight",
                description="Book flight to NYC",
                priority=FlowPriority.HIGH,
            )

            mock_ai_service.stream_chat_response = mock_stream
            mock_ai_service.extract_flows_from_text = AsyncMock(return_value=[mock_extracted_flow])

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo
            app.dependency_overrides[get_conversation_repository] = lambda: mock_conv_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "I need to book a flight"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Consume the stream
            list(response.iter_lines())

            # Verify extract_flows_from_text was called
            mock_ai_service.extract_flows_from_text.assert_called_once()

            # Verify flow creation was called
            mock_flow_repo.create.assert_called_once()
            call_args = mock_flow_repo.create.call_args
            assert call_args.kwargs["user_id"] == "test_user_123"
            assert call_args.kwargs["context_id"] == context_id

    def test_stream_chat_metadata_event_includes_flow_ids(
        self, client, mock_context_data, chat_messages, mock_ai_service, mock_flow_data
    ):
        """Test that metadata event includes extracted flow IDs (AC: 1)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context ownership verification
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )

            # Mock flow repository with created flows
            flow1 = FlowInDB(**mock_flow_data)
            flow2_data = {**mock_flow_data, "_id": ObjectId(), "title": "Call client"}
            flow2 = FlowInDB(**flow2_data)

            create_calls = [flow1, flow2]
            mock_flow_repo = create_mock_flow_repository(
                create=AsyncMock(side_effect=create_calls),
            )
            mock_flow_repo.context_repo = mock_context_repo

            # Mock conversation repository
            mock_conv_repo = create_mock_conversation_repository()

            # Mock AI service
            async def mock_stream(
                messages,
                context_id,
                tools=None,
                available_flows=None,
                is_context_switch=False,
                context_name=None,
            ):
                for token in ["Sure"]:
                    yield {"type": "text", "content": token}

            mock_extracted_flows = [
                FlowCreate(
                    context_id=str(mock_context_data["_id"]),
                    title="Book flight",
                    priority=FlowPriority.HIGH,
                ),
                FlowCreate(
                    context_id=str(mock_context_data["_id"]),
                    title="Call client",
                    priority=FlowPriority.MEDIUM,
                ),
            ]

            mock_ai_service.stream_chat_response = mock_stream
            mock_ai_service.extract_flows_from_text = AsyncMock(return_value=mock_extracted_flows)

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo
            app.dependency_overrides[get_conversation_repository] = lambda: mock_conv_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "Book flight and call client"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Read events and find flows_extracted event
            events = list(response.iter_lines())
            flows_data = None
            for line in events:
                if line.startswith("data: "):
                    with contextlib.suppress(json.JSONDecodeError):
                        event = json.loads(line[6:])
                        if event.get("type") == "flows_extracted":
                            flows_data = event.get("payload", {})
                            break

            # Verify flows_extracted event contains flow IDs
            assert flows_data is not None
            assert "flows" in flows_data
            assert len(flows_data["flows"]) == 2
            extracted_ids = [f["id"] for f in flows_data["flows"]]
            assert str(flow1.id) in extracted_ids
            assert str(flow2.id) in extracted_ids

    def test_stream_chat_handles_ai_service_error(
        self, client, mock_context_data, chat_messages, mock_ai_service
    ):
        """Test that AI service errors are handled gracefully (AC: 3)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context ownership verification
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            mock_flow_repo = create_mock_flow_repository()
            mock_flow_repo.context_repo = mock_context_repo

            # Mock conversation repository
            mock_conv_repo = create_mock_conversation_repository()

            # Mock AI service to raise error
            async def mock_stream_error(
                messages,
                context_id,
                tools=None,
                available_flows=None,
                is_context_switch=False,
                context_name=None,
            ):
                error_msg = "AI service unavailable"
                raise AIServiceError(error_msg)

            mock_ai_service.stream_chat_response = mock_stream_error

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo
            app.dependency_overrides[get_conversation_repository] = lambda: mock_conv_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "Hello"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Should still return 200 (streaming started)
            assert response.status_code == status.HTTP_200_OK

            # But should contain error event in JSON format
            events = list(response.iter_lines())
            error_events = []
            for line in events:
                if line.startswith("data: "):
                    with contextlib.suppress(json.JSONDecodeError):
                        event = json.loads(line[6:])
                        if event.get("type") == "error":
                            error_events.append(event)
            assert len(error_events) == 1

    def test_stream_chat_flow_extraction_failure_non_fatal(
        self, client, mock_context_data, chat_messages, mock_ai_service
    ):
        """Test that flow extraction failures don't stop the stream (AC: 3)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context ownership verification
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )
            mock_flow_repo = create_mock_flow_repository()
            mock_flow_repo.context_repo = mock_context_repo

            # Mock conversation repository
            mock_conv_repo = create_mock_conversation_repository()

            # Mock AI service - streaming works, extraction fails
            async def mock_stream(
                messages,
                context_id,
                tools=None,
                available_flows=None,
                is_context_switch=False,
                context_name=None,
            ):
                for token in ["Hello", " there"]:
                    yield {"type": "text", "content": token}

            mock_ai_service.stream_chat_response = mock_stream
            extraction_error = AIServiceError("Extraction failed")
            mock_ai_service.extract_flows_from_text = AsyncMock(side_effect=extraction_error)

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo
            app.dependency_overrides[get_conversation_repository] = lambda: mock_conv_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "Hello"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Should complete successfully even with extraction failure
            assert response.status_code == status.HTTP_200_OK

            events = list(response.iter_lines())

            # Parse JSON events
            json_events = []
            for line in events:
                if line.startswith("data: "):
                    with contextlib.suppress(json.JSONDecodeError):
                        json_events.append(json.loads(line[6:]))

            # Should have assistant_token events (streaming worked)
            token_events = [e for e in json_events if e.get("type") == "assistant_token"]
            assert len(token_events) > 0

            # Should have done event (stream completed)
            done_events = [e for e in json_events if e.get("type") == "done"]
            assert len(done_events) == 1

            # Should NOT have error event (extraction failure is non-fatal)
            error_events = [e for e in json_events if e.get("type") == "error"]
            assert len(error_events) == 0

    def test_stream_chat_individual_flow_creation_failure(
        self, client, mock_context_data, chat_messages, mock_ai_service, mock_flow_data
    ):
        """Test that individual flow creation failures don't stop others (AC: 3)."""
        with mock_auth_success(user_id="test_user_123"):
            # Mock context ownership verification
            mock_context_repo = create_mock_context_repository(
                get_by_id=AsyncMock(return_value=ContextInDB(**mock_context_data)),
            )

            # Mock flow repository - first flow fails, second succeeds
            flow2_data = {**mock_flow_data, "_id": ObjectId(), "title": "Call client"}
            flow2 = FlowInDB(**flow2_data)

            mock_flow_repo = create_mock_flow_repository(
                create=AsyncMock(side_effect=[Exception("DB error"), flow2]),
            )
            mock_flow_repo.context_repo = mock_context_repo

            # Mock conversation repository
            mock_conv_repo = create_mock_conversation_repository()

            # Mock AI service
            async def mock_stream(
                messages,
                context_id,
                tools=None,
                available_flows=None,
                is_context_switch=False,
                context_name=None,
            ):
                for token in ["Sure"]:
                    yield {"type": "text", "content": token}

            mock_extracted_flows = [
                FlowCreate(
                    context_id=str(mock_context_data["_id"]),
                    title="Book flight",
                    priority=FlowPriority.HIGH,
                ),
                FlowCreate(
                    context_id=str(mock_context_data["_id"]),
                    title="Call client",
                    priority=FlowPriority.MEDIUM,
                ),
            ]

            mock_ai_service.stream_chat_response = mock_stream
            mock_ai_service.extract_flows_from_text = AsyncMock(return_value=mock_extracted_flows)

            app.dependency_overrides[get_flow_repository] = lambda: mock_flow_repo
            app.dependency_overrides[get_conversation_repository] = lambda: mock_conv_repo

            context_id = str(mock_context_data["_id"])
            response = client.post(
                "/api/v1/conversations/stream",
                json={
                    "context_id": context_id,
                    "messages": [{"role": "user", "content": "Book flight and call client"}],
                },
                headers={"Authorization": "Bearer valid-token"},
            )

            # Read events and find flows_extracted event
            events = list(response.iter_lines())
            flows_data = None
            for line in events:
                if line.startswith("data: "):
                    with contextlib.suppress(json.JSONDecodeError):
                        event = json.loads(line[6:])
                        if event.get("type") == "flows_extracted":
                            flows_data = event.get("payload", {})
                            break

            # Verify flows_extracted contains only the successful flow
            assert flows_data is not None
            assert "flows" in flows_data
            assert len(flows_data["flows"]) == 1  # Only flow2 succeeded
            extracted_ids = [f["id"] for f in flows_data["flows"]]
            assert str(flow2.id) in extracted_ids

    def test_stream_chat_validates_request_model(self, client, mock_context_data):
        """Test that request validation works correctly."""
        with mock_auth_success(user_id="test_user_123"):
            context_id = str(mock_context_data["_id"])

            # Test with empty messages
            response = client.post(
                "/api/v1/conversations/stream",
                json={"context_id": context_id, "messages": []},
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Test with missing context_id
            response = client.post(
                "/api/v1/conversations/stream",
                json={"messages": [{"role": "user", "content": "Hello"}]},
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
