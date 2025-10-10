"""Unit tests for AI service."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from anthropic import APITimeoutError as AnthropicAPITimeoutError
from anthropic import RateLimitError as AnthropicRateLimitError
from openai import APIError as OpenAIAPIError
from openai import APITimeoutError as OpenAITimeout
from openai import RateLimitError as OpenAIRateLimitError

from src.models.conversation import Message
from src.services.ai_service import AIService
from src.utils.exceptions import (
    AIProviderNotSupported,
    AIRateLimitError,
    AIServiceError,
    AIStreamingError,
)

# ============================================================================
# TASK 9: Provider Initialization Tests
# ============================================================================


@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
def test_init_openai_provider(mock_openai_class, mock_settings):
    """Test AIService initialization with OpenAI provider."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-openai-key"

    service = AIService()

    assert service.provider == "openai"
    assert service.model == "gpt-4"
    mock_openai_class.assert_called_once_with(api_key="test-openai-key")


@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncAnthropic")
def test_init_anthropic_provider(mock_anthropic_class, mock_settings):
    """Test AIService initialization with Anthropic provider."""
    mock_settings.AI_PROVIDER = "anthropic"
    mock_settings.AI_MODEL = "claude-3-5-sonnet-20241022"
    mock_settings.ANTHROPIC_API_KEY = "test-anthropic-key"

    service = AIService()

    assert service.provider == "anthropic"
    assert service.model == "claude-3-5-sonnet-20241022"
    mock_anthropic_class.assert_called_once_with(api_key="test-anthropic-key")


@patch("src.services.ai_service.settings")
def test_init_unsupported_provider(mock_settings):
    """Test AIService initialization raises error for unsupported provider."""
    mock_settings.AI_PROVIDER = "unsupported-provider"

    with pytest.raises(AIProviderNotSupported) as exc_info:
        AIService()

    assert "unsupported-provider" in str(exc_info.value)
    assert "not supported" in str(exc_info.value)


@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
def test_init_openai_default_model(mock_openai_class, mock_settings):
    """Test AIService uses default model when AI_MODEL is None."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = None
    mock_settings.OPENAI_API_KEY = "test-key"

    service = AIService()

    assert service.model == "gpt-4"


# ============================================================================
# TASK 10: OpenAI Streaming Tests
# ============================================================================


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_openai_yields_tokens(mock_openai_class, mock_settings):
    """Test OpenAI streaming yields tokens correctly."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    # Mock streaming response - create proper async generator
    async def mock_stream():
        # Create mock chunks with proper structure
        mock_choice1 = MagicMock()
        mock_choice1.delta.content = "Hello"
        mock_chunk1 = MagicMock()
        mock_chunk1.choices = [mock_choice1]
        yield mock_chunk1

        mock_choice2 = MagicMock()
        mock_choice2.delta.content = " World"
        mock_chunk2 = MagicMock()
        mock_chunk2.choices = [mock_choice2]
        yield mock_chunk2

    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = mock_stream()
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]
    tokens = []

    async for token in service._stream_openai(messages, "work"):
        tokens.append(token)

    assert tokens == ["Hello", " World"]


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_openai_includes_system_prompt(mock_openai_class, mock_settings):
    """Test OpenAI streaming includes context-specific system prompt."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    # Create async generator that yields nothing (we're testing the call args)
    async def mock_stream():
        # Return an empty async generator
        if False:  # pragma: no cover
            yield

    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = mock_stream()
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    async for _ in service._stream_openai(messages, "work"):
        pass

    # Verify system prompt was added
    call_args = mock_client.chat.completions.create.call_args
    sent_messages = call_args.kwargs["messages"]
    assert sent_messages[0]["role"] == "system"
    assert "work" in sent_messages[0]["content"]


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_openai_handles_rate_limit(mock_openai_class, mock_settings):
    """Test OpenAI streaming handles rate limit errors."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    # Create proper OpenAI exception with required parameters
    mock_request = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    mock_response = httpx.Response(429, request=mock_request)
    rate_limit_error = OpenAIRateLimitError(
        "Rate limit exceeded",
        response=mock_response,
        body={"error": {"message": "Rate limit exceeded"}},
    )

    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = rate_limit_error
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    with pytest.raises(AIRateLimitError) as exc_info:
        async for _ in service._stream_openai(messages, "work"):
            pass

    assert "rate limit" in str(exc_info.value).lower()


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_openai_handles_timeout(mock_openai_class, mock_settings):
    """Test OpenAI streaming handles timeout errors."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    # Create proper OpenAI Timeout exception
    mock_request = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    timeout_error = OpenAITimeout(request=mock_request)

    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = timeout_error
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    with pytest.raises(AIStreamingError) as exc_info:
        async for _ in service._stream_openai(messages, "work"):
            pass

    # The error message contains "timed out" which includes "timeout" as substring
    error_msg = str(exc_info.value).lower()
    assert "timed out" in error_msg or "timeout" in error_msg


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_openai_handles_api_error(mock_openai_class, mock_settings):
    """Test OpenAI streaming handles API errors."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    # Create proper OpenAI API exception (message, request, body)
    mock_request = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    api_error = OpenAIAPIError(
        "API error", request=mock_request, body={"error": {"message": "Server error"}}
    )

    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = api_error
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    with pytest.raises(AIStreamingError):
        async for _ in service._stream_openai(messages, "work"):
            pass


# ============================================================================
# TASK 11: Anthropic Streaming Tests
# ============================================================================


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncAnthropic")
async def test_stream_anthropic_yields_tokens(mock_anthropic_class, mock_settings):
    """Test Anthropic streaming yields tokens correctly."""
    mock_settings.AI_PROVIDER = "anthropic"
    mock_settings.AI_MODEL = "claude-3-5-sonnet-20241022"
    mock_settings.ANTHROPIC_API_KEY = "test-key"

    # Mock text_stream as async generator
    async def mock_text_stream():
        yield "Hello"
        yield " World"

    # Create mock stream object with text_stream attribute
    mock_stream = MagicMock()
    mock_stream.text_stream = mock_text_stream()

    # Mock the async context manager properly
    mock_stream_manager = MagicMock()
    mock_stream_manager.__aenter__ = AsyncMock(return_value=mock_stream)
    mock_stream_manager.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    # Make stream a regular (non-async) method that returns the context manager
    mock_client.messages.stream = MagicMock(return_value=mock_stream_manager)
    mock_anthropic_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]
    tokens = []

    async for token in service._stream_anthropic(messages, "work"):
        tokens.append(token)

    assert tokens == ["Hello", " World"]


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncAnthropic")
async def test_stream_anthropic_system_prompt_separate(mock_anthropic_class, mock_settings):
    """Test Anthropic streaming uses system parameter correctly."""
    mock_settings.AI_PROVIDER = "anthropic"
    mock_settings.AI_MODEL = "claude-3-5-sonnet-20241022"
    mock_settings.ANTHROPIC_API_KEY = "test-key"

    # Empty async generator for testing call args
    async def mock_text_stream():
        if False:  # pragma: no cover
            yield

    # Create mock stream object
    mock_stream = MagicMock()
    mock_stream.text_stream = mock_text_stream()

    # Mock the async context manager
    mock_stream_manager = MagicMock()
    mock_stream_manager.__aenter__ = AsyncMock(return_value=mock_stream)
    mock_stream_manager.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    # Make stream a regular (non-async) method that returns the context manager
    mock_client.messages.stream = MagicMock(return_value=mock_stream_manager)
    mock_anthropic_class.return_value = mock_client

    service = AIService()
    messages = [
        Message(role="system", content="You are helpful"),
        Message(role="user", content="Test"),
    ]

    async for _ in service._stream_anthropic(messages, "work"):
        pass

    # Verify system prompt was passed as parameter
    call_args = mock_client.messages.stream.call_args
    assert "system" in call_args.kwargs
    assert "work" in call_args.kwargs["system"]

    # Verify system message not in messages list
    sent_messages = call_args.kwargs["messages"]
    assert all(msg["role"] != "system" for msg in sent_messages)


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncAnthropic")
async def test_stream_anthropic_handles_rate_limit(mock_anthropic_class, mock_settings):
    """Test Anthropic streaming handles rate limit errors."""
    mock_settings.AI_PROVIDER = "anthropic"
    mock_settings.AI_MODEL = "claude-3-5-sonnet-20241022"
    mock_settings.ANTHROPIC_API_KEY = "test-key"

    # Create proper Anthropic exception (message, response, body)
    mock_request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    mock_response = httpx.Response(429, request=mock_request)
    rate_limit_error = AnthropicRateLimitError(
        "Rate limit exceeded",
        response=mock_response,
        body={"error": {"message": "Rate limit exceeded"}},
    )

    # Mock context manager that raises on __aenter__
    mock_stream_manager = MagicMock()
    mock_stream_manager.__aenter__ = AsyncMock(side_effect=rate_limit_error)
    mock_stream_manager.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    # Make stream a regular (non-async) method that returns the context manager
    mock_client.messages.stream = MagicMock(return_value=mock_stream_manager)
    mock_anthropic_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    with pytest.raises(AIRateLimitError) as exc_info:
        async for _ in service._stream_anthropic(messages, "work"):
            pass

    assert "rate limit" in str(exc_info.value).lower()


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncAnthropic")
async def test_stream_anthropic_handles_timeout(mock_anthropic_class, mock_settings):
    """Test Anthropic streaming handles timeout errors."""
    mock_settings.AI_PROVIDER = "anthropic"
    mock_settings.AI_MODEL = "claude-3-5-sonnet-20241022"
    mock_settings.ANTHROPIC_API_KEY = "test-key"

    # Create proper Anthropic timeout exception
    mock_request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    timeout_error = AnthropicAPITimeoutError(request=mock_request)

    # Mock context manager that raises on __aenter__
    mock_stream_manager = MagicMock()
    mock_stream_manager.__aenter__ = AsyncMock(side_effect=timeout_error)
    mock_stream_manager.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    # Make stream a regular (non-async) method that returns the context manager
    mock_client.messages.stream = MagicMock(return_value=mock_stream_manager)
    mock_anthropic_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    with pytest.raises(AIStreamingError) as exc_info:
        async for _ in service._stream_anthropic(messages, "work"):
            pass

    assert "timeout" in str(exc_info.value).lower()


# ============================================================================
# TASK 12: Public API Tests
# ============================================================================


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_chat_response_delegates_to_openai(mock_openai_class, mock_settings):
    """Test stream_chat_response delegates to OpenAI correctly."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    # Mock streaming response
    async def mock_stream():
        mock_choice = MagicMock()
        mock_choice.delta.content = "Test"
        mock_chunk = MagicMock()
        mock_chunk.choices = [mock_choice]
        yield mock_chunk

    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = mock_stream()
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]
    tokens = []

    async for token in service.stream_chat_response(messages, "work"):
        tokens.append(token)

    assert tokens == ["Test"]


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncAnthropic")
async def test_stream_chat_response_delegates_to_anthropic(mock_anthropic_class, mock_settings):
    """Test stream_chat_response delegates to Anthropic correctly."""
    mock_settings.AI_PROVIDER = "anthropic"
    mock_settings.AI_MODEL = "claude-3-5-sonnet-20241022"
    mock_settings.ANTHROPIC_API_KEY = "test-key"

    # Mock text stream
    async def mock_text_stream():
        yield "Test"

    # Create mock stream object
    mock_stream = MagicMock()
    mock_stream.text_stream = mock_text_stream()

    # Mock context manager
    mock_stream_manager = MagicMock()
    mock_stream_manager.__aenter__ = AsyncMock(return_value=mock_stream)
    mock_stream_manager.__aexit__ = AsyncMock(return_value=None)

    mock_client = AsyncMock()
    # Make stream a regular (non-async) method that returns the context manager
    mock_client.messages.stream = MagicMock(return_value=mock_stream_manager)
    mock_anthropic_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]
    tokens = []

    async for token in service.stream_chat_response(messages, "work"):
        tokens.append(token)

    assert tokens == ["Test"]


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_chat_response_validates_inputs(mock_openai_class, mock_settings):
    """Test stream_chat_response validates empty messages and missing context_id."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    service = AIService()

    # Test empty messages
    with pytest.raises(ValueError, match=r".*empty.*") as exc_info:
        async for _ in service.stream_chat_response([], "work"):
            pass
    assert "empty" in str(exc_info.value).lower()

    # Test missing context_id
    messages = [Message(role="user", content="Test")]
    with pytest.raises(ValueError, match=r".*[Cc]ontext.*") as exc_info:
        async for _ in service.stream_chat_response(messages, ""):
            pass
    assert "context" in str(exc_info.value).lower()


@pytest.mark.asyncio
@patch("src.services.ai_service.settings")
@patch("src.services.ai_service.AsyncOpenAI")
async def test_stream_chat_response_wraps_provider_errors(mock_openai_class, mock_settings):
    """Test stream_chat_response wraps provider errors in AIServiceError."""
    mock_settings.AI_PROVIDER = "openai"
    mock_settings.AI_MODEL = "gpt-4"
    mock_settings.OPENAI_API_KEY = "test-key"

    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = Exception("Unexpected error")
    mock_openai_class.return_value = mock_client

    service = AIService()
    messages = [Message(role="user", content="Test")]

    with pytest.raises(AIServiceError):
        async for _ in service.stream_chat_response(messages, "work"):
            pass


# Note: extract_flows_from_text is now fully implemented in Story 3.3
# Comprehensive tests are in tests/unit/services/test_flow_extraction.py
# The old stub test has been removed as the method now has full functionality
