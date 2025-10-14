"""Flow API routes for CRUD operations."""

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from src.dependencies import get_context_repository, get_flow_repository
from src.middleware.auth import (
    get_current_user,
    verify_context_ownership,
    verify_flow_ownership,
)
from src.models.errors import RateLimitError
from src.models.flow import FlowCreate, FlowInDB, FlowUpdate
from src.models.pagination import PaginatedResponse
from src.rate_limit import limiter
from src.services.cache_service import summary_cache

if TYPE_CHECKING:
    from src.repositories.context_repository import ContextRepository
    from src.repositories.flow_repository import FlowRepository

router = APIRouter(tags=["Flows"])

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


@router.get(
    "/api/v1/contexts/{context_id}/flows",
    response_model=PaginatedResponse[FlowInDB],
    summary="List flows for a context",
    description="List all flows for a context with pagination and optional completion filter",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("60/minute")
async def list_flows(
    context_id: str,
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    context_repo: "ContextRepository" = Depends(get_context_repository),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
    include_completed: bool = Query(default=False, description="Include completed flows"),
    limit: int = Query(default=50, ge=1, le=100, description="Max items per page"),
    offset: int = Query(default=0, ge=0, le=10000, description="Number of items to skip"),
) -> PaginatedResponse[FlowInDB]:
    """
    List flows for context with pagination metadata.

    Enables UI features like progress indicators ("Showing 1-50 of 150 flows")
    and "Load More" buttons.
    """
    # Verify ownership
    await verify_context_ownership(context_id, user_id, context_repo)

    # Get total count for metadata
    total = await flow_repo.count_by_context(context_id, include_completed=include_completed)

    # Fetch flows with pagination
    flows = await flow_repo.get_all_by_context(
        context_id,
        user_id,
        include_completed=include_completed,
        limit=limit,
        offset=offset,
    )

    return PaginatedResponse(
        items=flows,
        total=total,
        limit=limit,
        offset=offset,
        has_more=(offset + len(flows)) < total,
    )


@router.post(
    "/api/v1/flows",
    response_model=FlowInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new flow",
    description="Create a new flow in a context (requires context ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("30/minute")
async def create_flow(
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    flow_data: FlowCreate,
    user_id: str = Depends(get_current_user),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
    context_repo: "ContextRepository" = Depends(get_context_repository),
) -> FlowInDB:
    """Create a new flow with context ownership verification."""
    # Verify context ownership
    await verify_context_ownership(flow_data.context_id, user_id, context_repo)

    # Create flow
    flow = await flow_repo.create(user_id, flow_data.context_id, flow_data)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Context not found",
        )

    # Invalidate context summary cache to reflect new flow
    cache_key = f"summary:{flow.context_id}"
    await summary_cache.delete(cache_key)

    return flow


@router.get(
    "/api/v1/flows/{flow_id}",
    response_model=FlowInDB,
    summary="Get a single flow",
    description="Get a flow by ID (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("60/minute")
async def get_flow(
    flow_id: str,
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> FlowInDB:
    """Get single flow by ID with ownership check."""
    # Use helper to verify ownership and return flow
    return await verify_flow_ownership(flow_id, user_id, flow_repo)


@router.put(
    "/api/v1/flows/{flow_id}",
    response_model=FlowInDB,
    summary="Update a flow",
    description="Update a flow by ID (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("30/minute")
async def update_flow(
    flow_id: str,
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    updates: FlowUpdate,
    user_id: str = Depends(get_current_user),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> FlowInDB:
    """Update flow with ownership check."""
    # Use helper to verify ownership
    await verify_flow_ownership(flow_id, user_id, flow_repo)

    # Update flow
    updated_flow = await flow_repo.update(flow_id, user_id, updates)
    if not updated_flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found",
        )
    return updated_flow


@router.delete(
    "/api/v1/flows/{flow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a flow",
    description="Delete a flow by ID (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("30/minute")
async def delete_flow(
    flow_id: str,
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> None:
    """Delete flow with ownership check."""
    # Get flow first to get context_id for cache invalidation
    flow = await verify_flow_ownership(flow_id, user_id, flow_repo)

    # Delete flow
    deleted = await flow_repo.delete(flow_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found",
        )

    # Invalidate context summary cache to reflect updated counts
    cache_key = f"summary:{flow.context_id}"
    await summary_cache.delete(cache_key)


@router.patch(
    "/api/v1/flows/{flow_id}/complete",
    response_model=FlowInDB,
    summary="Mark flow as complete",
    description="Mark a flow as completed (requires ownership)",
    responses=RATE_LIMIT_RESPONSE,
)
@limiter.limit("30/minute")
async def mark_flow_complete(
    flow_id: str,
    request: Request,  # noqa: ARG001 - slowapi requires the request parameter
    user_id: str = Depends(get_current_user),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> FlowInDB:
    """Mark flow as completed with timestamp."""
    # Use helper to verify ownership
    await verify_flow_ownership(flow_id, user_id, flow_repo)

    # Mark complete
    completed_flow = await flow_repo.mark_complete(flow_id, user_id)
    if not completed_flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found or already completed",
        )

    # Invalidate context summary cache to reflect updated counts
    cache_key = f"summary:{completed_flow.context_id}"
    await summary_cache.delete(cache_key)

    return completed_flow
