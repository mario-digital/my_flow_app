"""Transition suggestion API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from src.dependencies import get_context_repository, get_flow_repository
from src.middleware.auth import get_current_user
from src.models.transition import TransitionSuggestions
from src.repositories.context_repository import ContextRepository
from src.repositories.flow_repository import FlowRepository
from src.services.transition_service import TransitionService

router = APIRouter(prefix="/api/v1/transitions", tags=["transitions"])


async def get_transition_service(
    flow_repo: Annotated[FlowRepository, Depends(get_flow_repository)],
    context_repo: Annotated[ContextRepository, Depends(get_context_repository)],
) -> TransitionService:
    """Dependency injection for TransitionService."""
    return TransitionService(flow_repo, context_repo)


@router.get("/suggestions", response_model=TransitionSuggestions)
async def get_transition_suggestions(
    from_context: Annotated[str, Query(alias="from", description="Context ID user is leaving")],
    to_context: Annotated[str, Query(alias="to", description="Context ID user is switching to")],
    user_id: Annotated[str, Depends(get_current_user)],
    service: Annotated[TransitionService, Depends(get_transition_service)],
) -> TransitionSuggestions:
    """
    Get intelligent suggestions when switching contexts.

    Analyzes incomplete flows and priorities to provide warnings
    about the source context and suggestions for the target context.

    **Query Parameters:**
    - `from`: Context ID user is leaving
    - `to`: Context ID user is switching to

    **Returns:**
    - Warnings about incomplete flows in source context
    - Suggestions for target context (urgent flows, priorities)
    - List of urgent flows in target context

    **Example:**
    ```
    GET /api/v1/transitions/suggestions?from=ctx-work-123&to=ctx-personal-456
    ```
    """
    try:
        return await service.get_transition_suggestions(
            from_context_id=from_context,
            to_context_id=to_context,
            user_id=user_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate transition suggestions: {e!s}",
        ) from e
