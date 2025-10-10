"""Conversation API routes for chat streaming and flow extraction."""

import logging
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.middleware.auth import get_current_user
from src.models.conversation import Message
from src.models.flow import FlowCreate
from src.repositories.flow_repository import FlowRepository
from src.services.ai_service import AIService
from src.utils.database import get_db  # type: ignore[import-untyped]
from src.utils.exceptions import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["conversations"])


class ChatRequest(BaseModel):
    """Request model for chat streaming."""

    context_id: str = Field(..., description="Context ID for the conversation")
    messages: list[Message] = Field(
        ..., min_length=1, description="Conversation history including new user message"
    )


class ChatStreamMetadata(BaseModel):
    """Metadata sent after chat stream completes."""

    extracted_flows: list[str] = Field(
        default_factory=list, description="IDs of flows extracted from conversation"
    )


@router.post("/stream")
async def stream_chat(
    chat_request: ChatRequest,
    user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[FlowRepository, Depends(lambda: FlowRepository(get_db()))],
) -> StreamingResponse:
    """Stream AI chat response and extract flows.

    This endpoint:
    1. Streams AI response token-by-token using Server-Sent Events (SSE)
    2. After streaming completes, extracts flows from the conversation
    3. Creates extracted flows in the database
    4. Sends flow IDs as final SSE event

    Args:
        request: FastAPI request object
        chat_request: Chat request with context_id and messages
        user_id: Authenticated user ID from JWT token
        db: Flow repository for storing extracted flows

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

    ai_service = AIService()

    async def generate_sse_stream() -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events stream."""
        try:
            # Step 1: Stream AI response
            full_response = ""
            async for token in ai_service.stream_chat_response(
                chat_request.messages, chat_request.context_id
            ):
                # Send token as SSE data event
                full_response += token
                yield f"data: {token}\n\n"

            logger.info("Chat stream completed, response length: %d", len(full_response))

            # Step 2: Extract flows from full conversation
            # Build conversation text from messages + AI response
            conversation_text = "\n".join(
                [f"{msg.role}: {msg.content}" for msg in chat_request.messages]
            )
            conversation_text += f"\nassistant: {full_response}"

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
            flow_ids: list[str] = []
            for flow in extracted_flows:
                try:
                    created_flow = await db.create(
                        user_id=user_id,
                        context_id=chat_request.context_id,
                        flow_data=flow,
                    )
                    if created_flow:
                        flow_ids.append(created_flow.id)
                except Exception as e:
                    logger.error("Failed to create flow: %s", str(e))
                    # Continue creating other flows

            # Step 4: Send metadata event with extracted flow IDs
            metadata = ChatStreamMetadata(extracted_flows=flow_ids)
            yield f"event: metadata\ndata: {metadata.model_dump_json()}\n\n"

            # Step 5: Send done event
            yield "event: done\ndata: {}\n\n"

        except AIServiceError as e:
            logger.error("AI service error during streaming: %s", str(e))
            error_msg = f"event: error\ndata: {{'error': 'AI service error: {e!s}'}}\n\n"
            yield error_msg
        except Exception as e:
            logger.exception("Unexpected error during streaming: %s", str(e))
            error_msg = "event: error\ndata: {'error': 'Internal server error'}\n\n"
            yield error_msg

    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
