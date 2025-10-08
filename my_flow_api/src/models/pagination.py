"""Pagination response model for API list endpoints."""

from typing import ClassVar, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse[T](BaseModel):
    """
    Paginated response with metadata for UI components.

    Provides pagination metadata to enable UI features like:
    - "Page X of Y" indicators
    - Progress bars ("Showing 1-50 of 150")
    - "Load More" button visibility
    - Pagination component rendering
    """

    items: list[T] = Field(..., description="List of items for current page")
    total: int = Field(..., description="Total count of all items")
    limit: int = Field(..., description="Max items per page")
    offset: int = Field(..., description="Number of items skipped")
    has_more: bool = Field(..., description="True if more items available")

    class Config:
        """Pydantic model configuration."""

        json_schema_extra: ClassVar[dict[str, dict[str, object]]] = {
            "example": {
                "items": [],
                "total": 150,
                "limit": 50,
                "offset": 0,
                "has_more": True,
            }
        }
