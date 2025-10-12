"""Conversation API routes for chat streaming and flow extraction."""

import json
import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.database import get_database
from src.middleware.auth import get_current_user, verify_context_ownership
from src.models.conversation import Conversation, Message
from src.models.flow import FlowCreate
from src.repositories.context_repository import ContextRepository
from src.repositories.conversation_repository import ConversationRepository
from src.repositories.flow_repository import FlowRepository
from src.services.ai_service import AIService
from src.utils.exceptions import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


class ChatRequest(BaseModel):
    """Request model for chat streaming."""

    context_id: str = Field(..., description="Context ID for the conversation")
    messages: list[Message] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Conversation history including new user message",
    )


class ChatStreamMetadata(BaseModel):
    """Metadata sent after chat stream completes."""

    extracted_flows: list[str] = Field(
        default_factory=list, description="IDs of flows extracted from conversation"
    )


async def get_flow_repository() -> FlowRepository:
    """Dependency for FlowRepository."""
    db = await get_database()
    context_repo = ContextRepository(db)
    return FlowRepository(db, context_repo)


async def get_conversation_repository() -> ConversationRepository:
    """Dependency for ConversationRepository."""
    db = await get_database()
    return ConversationRepository(db)


@router.get("")
async def get_conversations(
    context_id: str,
    user_id: Annotated[str, Depends(get_current_user)],
    conversation_repo: Annotated[ConversationRepository, Depends(get_conversation_repository)],
    limit: int = 10,
) -> list[Conversation]:
    """Get conversation history for a context.

    Args:
        context_id: Context ID to fetch conversations for
        user_id: Authenticated user ID from JWT token
        conversation_repo: Conversation repository dependency
        limit: Maximum number of conversations to return (default: 10)

    Returns:
        List of conversations for the context, most recent first

    Note:
        Returns empty list if no conversations exist for the context.
        Only returns conversations owned by the authenticated user.
    """
    logger.info(
        "Fetching conversations for user=%s, context=%s, limit=%d",
        user_id,
        context_id,
        limit,
    )

    # Verify user owns the context
    db = await get_database()
    context_repo = ContextRepository(db)
    await verify_context_ownership(context_id, user_id, context_repo)

    # Fetch conversations
    conversations = await conversation_repo.get_conversations_by_context(context_id, user_id, limit)

    logger.info("Found %d conversations for context=%s", len(conversations), context_id)
    return conversations


@router.post("/stream")
async def stream_chat(
    chat_request: ChatRequest,
    user_id: Annotated[str, Depends(get_current_user)],
    flow_repo: Annotated[FlowRepository, Depends(get_flow_repository)],
) -> StreamingResponse:
    """Stream AI chat response and extract flows.

    This endpoint:
    1. Streams AI response token-by-token using Server-Sent Events (SSE)
    2. After streaming completes, extracts flows from the conversation
    3. Creates extracted flows in the database
    4. Sends flow IDs as final SSE event

    Args:
        chat_request: Chat request with context_id and messages
        user_id: Authenticated user ID from JWT token
        flow_repo: Flow repository for storing extracted flows

    Returns:
        StreamingResponse with text/event-stream content type

    Raises:
        HTTPException: 500 if AI service fails
    """
    logger.info(
        "Starting chat stream for user=%s, context=%s with %d messages",
        user_id,
        chat_request.context_id,
        len(chat_request.messages),
    )

    # Ensure the user owns the context before streaming any data
    await verify_context_ownership(
        chat_request.context_id,
        user_id,
        flow_repo.context_repo,
    )

    ai_service = AIService()

    async def generate_sse_stream() -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events stream."""
        try:
            # Step 1: Stream AI response
            full_response = ""
            # Generate unique message ID for each assistant response
            message_id = f"assistant-{uuid.uuid4()}"

            async for token in ai_service.stream_chat_response(
                chat_request.messages, chat_request.context_id
            ):
                # Send token as SSE data event with proper JSON format
                full_response += token
                event_data = {
                    "type": "assistant_token",
                    "payload": {"token": token, "messageId": message_id, "isComplete": False},
                }
                yield f"data: {json.dumps(event_data)}\n\n"

            # Send completion token
            completion_event = {
                "type": "assistant_token",
                "payload": {"token": "", "messageId": message_id, "isComplete": True},
            }
            yield f"data: {json.dumps(completion_event)}\n\n"

            logger.info("Chat stream completed, response length: %d", len(full_response))

            # Step 2: Extract flows from latest exchange only
            # Only analyze the most recent user message + assistant response to avoid duplicates
            last_user_message = chat_request.messages[-1]  # Get the last message (should be user)
            conversation_text = f"user: {last_user_message.content}\nassistant: {full_response}"

            logger.info(
                "Extracting flows from latest exchange: user='%s...', assistant='%s...'",
                last_user_message.content[:50],
                full_response[:50],
            )

            extracted_flows: list[FlowCreate] = []
            try:
                extracted_flows = await ai_service.extract_flows_from_text(
                    conversation_text, chat_request.context_id
                )
                logger.info("Extracted %d flows from conversation", len(extracted_flows))
            except AIServiceError as e:
                # Don't fail the whole stream if flow extraction fails
                logger.warning("Flow extraction failed (non-fatal): %s", str(e))

            # Step 3: Create extracted flows in database
            created_flows = []
            for flow in extracted_flows:
                try:
                    created_flow = await flow_repo.create(
                        user_id=user_id,
                        context_id=chat_request.context_id,
                        flow_data=flow,
                    )
                    if created_flow:
                        created_flows.append(created_flow)
                except Exception as e:
                    logger.error("Failed to create flow: %s", str(e))
                    # Continue creating other flows

            # Step 4: Send flows_extracted event if any flows were created
            if created_flows:
                flows_event = {
                    "type": "flows_extracted",
                    "payload": {"flows": [flow.model_dump(mode="json") for flow in created_flows]},
                }
                yield f"data: {json.dumps(flows_event)}\n\n"

            # Step 5: Send done event
            yield f"data: {json.dumps({'type': 'done', 'payload': {}})}\n\n"

        except AIServiceError as e:
            logger.error("AI service error during streaming: %s", str(e))
            error_event = {
                "type": "error",
                "payload": {
                    "message": "AI service temporarily unavailable",
                    "code": "ai_service_error",
                },
            }
            yield f"data: {json.dumps(error_event)}\n\n"
        except Exception as e:
            logger.exception("Unexpected error during streaming: %s", str(e))
            error_event = {
                "type": "error",
                "payload": {"message": "Internal server error", "code": "internal_error"},
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
