"""Common API error response models."""

from pydantic import BaseModel, ConfigDict, Field


class RateLimitError(BaseModel):
    """Rate limit exceeded error response."""

    detail: str = Field(
        ..., description="Human-readable explanation of the rate limit violation."
    )
    retry_after: int = Field(
        ..., description="Seconds until rate limit resets", json_schema_extra={"example": 60}
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": "Rate limit exceeded. Please try again later.",
                "retry_after": 60,
            }
        }
    )


__all__ = ["RateLimitError"]
