"""AI service for streaming chat responses using OpenAI or Anthropic."""

import logging
from collections.abc import AsyncGenerator

from anthropic import APIError as AnthropicAPIError
from anthropic import APITimeoutError as AnthropicAPITimeoutError
from anthropic import AsyncAnthropic
from anthropic import RateLimitError as AnthropicRateLimitError
from openai import APIError as OpenAIAPIError
from openai import APITimeoutError as OpenAITimeout
from openai import AsyncOpenAI
from openai import RateLimitError as OpenAIRateLimitError

from src.config import settings
from src.models.conversation import Message
from src.utils.exceptions import (
    AIProviderNotSupported,
    AIRateLimitError,
    AIServiceError,
    AIStreamingError,
)

logger = logging.getLogger(__name__)


class AIService:
    """AI service for streaming conversational responses."""

    def __init__(self) -> None:
        """Initialize AI service with configured provider.

        Raises:
            AIProviderNotSupported: If the configured provider is not supported
        """
        self.provider = settings.AI_PROVIDER.lower()

        if self.provider == "openai":
            self.openai_client: AsyncOpenAI | None = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.anthropic_client: AsyncAnthropic | None = None
            self.model = settings.AI_MODEL or "gpt-4"
        elif self.provider == "anthropic":
            self.openai_client = None
            self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.model = settings.AI_MODEL or "claude-3-5-sonnet-20241022"
        else:
            raise AIProviderNotSupported(self.provider)

        logger.info(
            "AI service initialized with provider: %s, model: %s", self.provider, self.model
        )

    async def _stream_openai(
        self, messages: list[Message], context_id: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from OpenAI.

        Args:
            messages: List of conversation messages
            context_id: Context identifier for system prompt

        Yields:
            str: Token chunks from the AI response

        Raises:
            AIRateLimitError: If rate limit is exceeded
            AIStreamingError: If streaming fails
        """
        try:
            if not self.openai_client:
                msg = "OpenAI client not initialized"
                raise AIStreamingError(msg)

            # Convert messages to OpenAI format and add context-specific system prompt
            system_prompt = f"You are an assistant for the user's {context_id} context"
            openai_messages = [{"role": "system", "content": system_prompt}]
            openai_messages.extend([{"role": msg.role, "content": msg.content} for msg in messages])

            logger.debug("Starting OpenAI stream for context: %s", context_id)

            # Create streaming completion
            stream = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=openai_messages,  # type: ignore[arg-type]
                stream=True,
            )

            # Yield tokens as they arrive
            async for chunk in stream:  # type: ignore[union-attr]
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

            logger.debug("OpenAI stream completed for context: %s", context_id)

        except OpenAIRateLimitError as e:
            logger.error("OpenAI rate limit exceeded: %s", str(e))
            msg = f"OpenAI rate limit exceeded: {e}"
            raise AIRateLimitError(msg) from e
        except OpenAITimeout as e:
            logger.error("OpenAI timeout: %s", str(e))
            msg = f"OpenAI request timed out: {e}"
            raise AIStreamingError(msg) from e
        except OpenAIAPIError as e:
            logger.error("OpenAI API error: %s", str(e))
            msg = f"OpenAI streaming failed: {e}"
            raise AIStreamingError(msg) from e

    async def _stream_anthropic(
        self, messages: list[Message], context_id: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from Anthropic.

        Args:
            messages: List of conversation messages
            context_id: Context identifier for system prompt

        Yields:
            str: Token chunks from the AI response

        Raises:
            AIRateLimitError: If rate limit is exceeded
            AIStreamingError: If streaming fails
        """
        try:
            if not self.anthropic_client:
                msg = "Anthropic client not initialized"
                raise AIStreamingError(msg)

            # Separate system messages (Anthropic uses system parameter)
            system_prompt = f"You are an assistant for the user's {context_id} context"
            anthropic_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
                if msg.role != "system"
            ]

            logger.debug("Starting Anthropic stream for context: %s", context_id)

            # Create streaming message
            async with self.anthropic_client.messages.stream(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=anthropic_messages,  # type: ignore[arg-type]
            ) as stream:
                async for text in stream.text_stream:
                    yield text

            logger.debug("Anthropic stream completed for context: %s", context_id)

        except AnthropicRateLimitError as e:
            logger.error("Anthropic rate limit exceeded: %s", str(e))
            msg = f"Anthropic rate limit exceeded: {e}"
            raise AIRateLimitError(msg) from e
        except AnthropicAPITimeoutError as e:
            logger.error("Anthropic timeout: %s", str(e))
            msg = f"Anthropic request timed out: {e}"
            raise AIStreamingError(msg) from e
        except AnthropicAPIError as e:
            logger.error("Anthropic API error: %s", str(e))
            msg = f"Anthropic streaming failed: {e}"
            raise AIStreamingError(msg) from e

    async def stream_chat_response(
        self, messages: list[Message], context_id: str
    ) -> AsyncGenerator[str, None]:
        """Stream AI chat response token-by-token.

        Args:
            messages: List of conversation messages (must not be empty)
            context_id: Context identifier for personalized system prompt

        Yields:
            str: Token chunks from the AI response

        Raises:
            ValueError: If messages is empty or context_id is missing
            AIServiceError: If streaming fails due to provider issues
        """
        # Validate inputs
        if not messages or len(messages) == 0:
            msg = "Messages list cannot be empty"
            raise ValueError(msg)
        if not context_id or len(context_id.strip()) == 0:
            msg = "Context ID must be provided"
            raise ValueError(msg)

        logger.info(
            "Streaming chat response for context: %s with %d messages", context_id, len(messages)
        )

        try:
            # Delegate to provider-specific streaming method
            if self.provider == "openai":
                async for token in self._stream_openai(messages, context_id):
                    yield token
            elif self.provider == "anthropic":
                async for token in self._stream_anthropic(messages, context_id):
                    yield token
            else:
                raise AIProviderNotSupported(self.provider)

        except (AIRateLimitError, AIStreamingError, AIProviderNotSupported):
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            # Wrap any unexpected errors
            logger.exception("Unexpected error during streaming: %s", str(e))
            msg = f"Streaming failed: {e}"
            raise AIServiceError(msg) from e

    async def extract_flows_from_text(
        self,
        conversation_text: str,  # noqa: ARG002
        context_id: str,
    ) -> list[dict[str, str]]:
        """Extract flows from conversation text.

        NOTE: This is a stub for Story 3.1. Full implementation will be added in Story 3.3.

        Args:
            conversation_text: The conversation text to analyze
            context_id: Context identifier for the conversation

        Returns:
            Empty list (stub implementation)

        TODO: Implement in Story 3.3 - Use AI to extract flow data from conversation text
        """
        logger.debug("extract_flows_from_text called (stub) for context: %s", context_id)
        # Return empty list for now - will implement in Story 3.3
        return []
