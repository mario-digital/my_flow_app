"""Context API routes for CRUD operations."""

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from src.dependencies import get_context_repository, get_flow_repository
from src.middleware.auth import get_current_user, verify_context_ownership
from src.models.context import ContextCreate, ContextInDB, ContextUpdate
from src.models.errors import RateLimitError
from src.models.pagination import PaginatedResponse
from src.rate_limit import limiter

if TYPE_CHECKING:
    from src.repositories.context_repository import ContextRepository
    from src.repositories.flow_repository import FlowRepository

router = APIRouter(prefix="/api/v1/contexts", tags=["Contexts"])

RATE_LIMIT_RESPONSE: dict[int | str, dict[str, Any]] = {
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


@router.get("", response_model=PaginatedResponse[ContextInDB], responses=RATE_LIMIT_RESPONSE)
@limiter.limit("60/minute")
async def list_contexts(
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
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
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    context_data: ContextCreate,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> ContextInDB:
    """Create a new context."""
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
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> ContextInDB:
    """Get single context by ID with ownership check."""
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
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    updates: ContextUpdate,
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> ContextInDB:
    """Update context with ownership check."""
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
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> None:
    """Delete context and cascade delete all associated flows."""
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
