"""Flow API routes for CRUD operations."""

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

import src.repositories.context_repository as context_repository_module
import src.repositories.flow_repository as flow_repository_module
from src.database import get_database
from src.middleware.auth import (
    get_current_user,
    verify_context_ownership,
    verify_flow_ownership,
)
from src.models.flow import FlowCreate, FlowInDB, FlowUpdate
from src.models.pagination import PaginatedResponse

if TYPE_CHECKING:
    from src.repositories.context_repository import ContextRepository
    from src.repositories.flow_repository import FlowRepository

router = APIRouter(tags=["Flows"])


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


@router.get(
    "/api/v1/contexts/{context_id}/flows",
    response_model=PaginatedResponse[FlowInDB],
    summary="List flows for a context",
    description="List all flows for a context with pagination and optional completion filter",
)
async def list_flows(
    context_id: str,
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
    total = await flow_repo.count_by_context(
        context_id, include_completed=include_completed
    )

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
)
async def create_flow(
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Context not found or access forbidden",
        )
    return flow


@router.get(
    "/api/v1/flows/{flow_id}",
    response_model=FlowInDB,
    summary="Get a single flow",
    description="Get a flow by ID (requires ownership)",
)
async def get_flow(
    flow_id: str,
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
)
async def update_flow(
    flow_id: str,
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
)
async def delete_flow(
    flow_id: str,
    user_id: str = Depends(get_current_user),
    flow_repo: "FlowRepository" = Depends(get_flow_repository),
) -> None:
    """Delete flow with ownership check."""
    # Use helper to verify ownership
    await verify_flow_ownership(flow_id, user_id, flow_repo)

    # Delete flow
    deleted = await flow_repo.delete(flow_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found",
        )


@router.patch(
    "/api/v1/flows/{flow_id}/complete",
    response_model=FlowInDB,
    summary="Mark flow as complete",
    description="Mark a flow as completed (requires ownership)",
)
async def mark_flow_complete(
    flow_id: str,
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
    return completed_flow
