"""Custom exception classes for AI service."""


class AIServiceError(Exception):
    """Base exception for AI service errors."""

    def __init__(self, message: str = "AI service error occurred") -> None:
        """Initialize AI service error.

        Args:
            message: Error message describing what went wrong
        """
        self.message = message
        super().__init__(self.message)


class AIProviderNotSupported(AIServiceError):  # noqa: N818
    """Exception raised when AI provider is not supported."""

    def __init__(self, provider: str) -> None:
        """Initialize provider not supported error.

        Args:
            provider: The unsupported provider name
        """
        self.provider = provider
        message = (
            f"AI provider '{provider}' is not supported. Supported providers: openai, anthropic"
        )
        super().__init__(message)


class AIStreamingError(AIServiceError):
    """Exception raised when streaming fails."""

    def __init__(self, message: str = "AI streaming failed") -> None:
        """Initialize streaming error.

        Args:
            message: Error message describing the streaming failure
        """
        super().__init__(message)


class AIRateLimitError(AIServiceError):
    """Exception raised when rate limit is exceeded."""

    def __init__(self, message: str = "AI provider rate limit exceeded") -> None:
        """Initialize rate limit error.

        Args:
            message: Error message describing the rate limit error
        """
        super().__init__(message)
