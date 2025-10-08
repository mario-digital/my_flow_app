"""Context API routes for CRUD operations."""

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

import src.repositories.context_repository as context_repository_module
import src.repositories.flow_repository as flow_repository_module
from src.database import get_database
from src.middleware.auth import get_current_user, verify_context_ownership
from src.models.context import ContextCreate, ContextInDB, ContextUpdate
from src.models.errors import RateLimitError
from src.models.pagination import PaginatedResponse
from src.rate_limit import limiter

if TYPE_CHECKING:
    from src.repositories.context_repository import ContextRepository
    from src.repositories.flow_repository import FlowRepository

router = APIRouter(prefix="/api/v1/contexts", tags=["Contexts"])

RATE_LIMIT_RESPONSE = {
    429: {
        "model": RateLimitError,
        "description": "Rate limit exceeded",
        "headers": {
            "Retry-After": {
                "description": "Seconds until rate limit resets",
                "schema": {"type": "integer"},
            }
        },
    }
}


async def get_context_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> "ContextRepository":
    """Dependency injection for ContextRepository."""
    return context_repository_module.ContextRepository(db)


async def get_flow_repository(
    db: AsyncIOMotorDatabase = Depends(get_database),  # type: ignore[type-arg]
) -> "FlowRepository":
    """Dependency injection for FlowRepository."""
    context_repo = context_repository_module.ContextRepository(db)
    return flow_repository_module.FlowRepository(db, context_repo)


@router.get("", response_model=PaginatedResponse[ContextInDB], responses=RATE_LIMIT_RESPONSE)
@limiter.limit("60/minute")
async def list_contexts(
    request: Request,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
    limit: int = Query(default=50, ge=1, le=100, description="Max items per page"),
    offset: int = Query(default=0, ge=0, le=10000, description="Number of items to skip"),
) -> PaginatedResponse[ContextInDB]:
    """
    List all contexts for the authenticated user with pagination metadata.

    Returns paginated contexts with metadata for UI components like
    "Page X of Y" indicators and "Load More" buttons.
    """
    # slowapi uses the request object to track rate limits
    _ = request

    # Get total count for metadata
    total = await context_repo.count_by_user(user_id)

    # Get paginated items
    contexts = await context_repo.get_all_by_user(user_id, limit=limit, offset=offset)

    return PaginatedResponse(
        items=contexts,
        total=total,
        limit=limit,
        offset=offset,
        has_more=(offset + len(contexts)) < total,
    )


@router.post(
    "",
    response_model=ContextInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new context",
    description="Create a new context for the authenticated user",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("10/minute")
async def create_context(
    request: Request,
    context_data: ContextCreate,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> ContextInDB:
    """Create a new context."""
    _ = request
    return await context_repo.create(user_id, context_data)


@router.get(
    "/{context_id}",
    response_model=ContextInDB,
    summary="Get a single context",
    description="Get a context by ID (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("60/minute")
async def get_context(
    context_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> ContextInDB:
    """Get single context by ID with ownership check."""
    _ = request
    context = await context_repo.get_by_id(context_id, user_id)
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )
    return context


@router.put(
    "/{context_id}",
    response_model=ContextInDB,
    summary="Update a context",
    description="Update a context by ID (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("30/minute")
async def update_context(
    context_id: str,
    request: Request,
    updates: ContextUpdate,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> ContextInDB:
    """Update context with ownership check."""
    _ = request
    # Verify ownership using helper
    await verify_context_ownership(context_id, user_id, context_repo)

    # Update context
    updated_context = await context_repo.update(context_id, user_id, updates)
    if not updated_context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )
    return updated_context


@router.delete(
    "/{context_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a context",
    description="Delete a context and all associated flows (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("30/minute")
async def delete_context(
    context_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> None:
    """Delete context and cascade delete all associated flows."""
    _ = request
    # Verify context ownership
    await verify_context_ownership(context_id, user_id, context_repo)

    # First delete all flows for context in bulk (single DB query)
    await flow_repo.delete_by_context_id(context_id, user_id)

    # Then delete context
    deleted = await context_repo.delete(context_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )
