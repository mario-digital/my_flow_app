"""Conversation API routes for chat streaming and flow extraction."""

import json
import logging
import re
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.database import get_database
from src.middleware.auth import get_current_user, verify_context_ownership
from src.models.conversation import Conversation, Message, MessageRole
from src.models.flow import FlowCreate
from src.repositories.context_repository import ContextRepository
from src.repositories.conversation_repository import ConversationRepository
from src.repositories.flow_repository import FlowRepository
from src.services.ai_service import AIService
from src.services.ai_tools import ai_tools
from src.services.cache_service import dismissed_flow_cache, summary_cache
from src.utils.exceptions import AIServiceError

logger = logging.getLogger(__name__)


STOPWORDS: set[str] = {"the", "a", "an", "to", "my", "your", "please"}


def _normalize_title(title: str) -> str:
    """Normalize flow titles for duplicate detection."""
    cleaned = re.sub(r"[^a-z0-9\s]+", " ", title.lower())
    tokens = [token for token in cleaned.split() if token and token not in STOPWORDS]
    return "".join(tokens)


router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


class ChatRequest(BaseModel):
    """Request model for chat streaming."""

    context_id: str = Field(..., description="Context ID for the conversation")
    conversation_id: str | None = Field(
        default=None,
        description="Existing conversation ID if continuing an active chat",
    )
    messages: list[Message] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Conversation history including new user message",
    )
    is_context_switch: bool = Field(
        default=False,
        description="True if this is the first message after switching to this context",
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
async def stream_chat(  # noqa: PLR0915, PLR0912
    chat_request: ChatRequest,
    user_id: Annotated[str, Depends(get_current_user)],
    flow_repo: Annotated[FlowRepository, Depends(get_flow_repository)],
    conversation_repo: Annotated[ConversationRepository, Depends(get_conversation_repository)],
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

    # Ensure conversation exists (create if needed)
    conversation: Conversation | None = None
    conversation_id = chat_request.conversation_id

    if conversation_id:
        conversation = await conversation_repo.get_conversation_by_id(conversation_id, user_id)
        if conversation is None:
            logger.warning(
                "Conversation %s not found or unauthorized; creating new conversation",
                conversation_id,
            )

    if conversation is None:
        existing_conversations = await conversation_repo.get_conversations_by_context(
            chat_request.context_id,
            user_id,
            limit=1,
        )
        if existing_conversations:
            conversation = existing_conversations[0]
        else:
            conversation = await conversation_repo.create_conversation(
                chat_request.context_id,
                user_id,
            )

    conversation_id = conversation.id
    logger.info(
        "Using conversation %s for context %s",
        conversation_id,
        chat_request.context_id,
    )

    # Append latest user message to conversation history
    latest_user_message: Message | None = None
    if chat_request.messages:
        last_message = chat_request.messages[-1]
        if last_message.role == MessageRole.USER:
            latest_user_message = last_message
        else:
            # Fallback: find most recent user message in payload
            for message in reversed(chat_request.messages):
                if message.role == MessageRole.USER:
                    latest_user_message = message
                    break

    user_message_added = False
    if latest_user_message is not None:
        last_existing_message = conversation.messages[-1] if conversation.messages else None
        duplicate_context_switch = (
            chat_request.is_context_switch
            and last_existing_message is not None
            and last_existing_message.role == MessageRole.USER
            and last_existing_message.content == latest_user_message.content
        )

        if duplicate_context_switch:
            logger.info(
                "Skipping append for context switch duplicate user message (conversation=%s)",
                conversation_id,
            )
        else:
            try:
                await conversation_repo.append_message(
                    conversation_id,
                    latest_user_message,
                    user_id,
                )
                user_message_added = True
            except ValueError as exc:
                logger.error(
                    "Failed to append user message to conversation %s: %s",
                    conversation_id,
                    exc,
                )

    # Fetch context details for friendly display name
    context = await flow_repo.context_repo.get_by_id(chat_request.context_id, user_id)
    context_display_name = context.name if context else chat_request.context_id

    # Get available flows for tool context
    flows = await flow_repo.get_all_by_context(
        chat_request.context_id, user_id, include_completed=False
    )
    available_flows = []
    existing_title_keys: set[str] = set()
    for flow in flows:
        available_flows.append(
            {
                "id": str(flow.id),
                "title": flow.title,
                "priority": flow.priority.value,
                "is_completed": flow.is_completed,
            }
        )
        existing_title_keys.add(_normalize_title(flow.title))

    # Get tool schemas for function calling
    tool_schemas = ai_tools.get_tool_schemas()
    logger.info("Tool schemas available: %d tools", len(tool_schemas))
    logger.info("Available flows for context: %d flows", len(available_flows))

    async def generate_sse_stream() -> AsyncGenerator[str, None]:  # noqa: PLR0915, PLR0912
        """Generate Server-Sent Events stream with function calling support."""
        try:
            # Step 1: Stream AI response with function calling
            full_response = ""
            # Generate unique message ID for each assistant response
            message_id = f"assistant-{uuid.uuid4()}"
            # Track if any tools were executed (to skip flow extraction)
            tools_executed = False

            async for chunk in ai_service.stream_chat_response(
                chat_request.messages,
                chat_request.context_id,
                tools=tool_schemas,
                available_flows=available_flows,
                is_context_switch=chat_request.is_context_switch,
                context_name=context_display_name,
            ):
                logger.debug("Received chunk type: %s", chunk["type"])

                if chunk["type"] == "text":
                    # Send text token
                    token = chunk["content"]
                    full_response += token
                    event_data = {
                        "type": "assistant_token",
                        "payload": {"token": token, "messageId": message_id, "isComplete": False},
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"

                elif chunk["type"] == "tool_call":
                    # Mark that tools were executed
                    tools_executed = True
                    # Execute tool
                    tool_name = chunk["name"]
                    logger.info("Executing tool: %s with args: %s", tool_name, chunk["arguments"])
                    try:
                        arguments = json.loads(chunk["arguments"])
                    except json.JSONDecodeError:
                        logger.error("Failed to parse tool arguments: %s", chunk["arguments"])
                        arguments = {}

                    # Execute the tool
                    result = await ai_tools.execute_tool(
                        tool_name,
                        arguments,
                        user_id,
                        flow_repo,
                    )

                    logger.info("Tool execution result: %s", result)

                    # Send tool execution event to frontend
                    tool_event = {
                        "type": "tool_executed",
                        "payload": {
                            "tool_name": tool_name,
                            "tool_id": chunk["id"],
                            "arguments": arguments,
                            "result": result,
                        },
                    }
                    yield f"data: {json.dumps(tool_event)}\n\n"

                    # Send tool result as visible text token to user
                    result_message = ""
                    if result.get("success"):
                        result_message = f"\n\n✓ {result.get('message', 'Action completed')}"
                    else:
                        result_message = f"\n\n✗ {result.get('error', 'Action failed')}"

                    full_response += result_message

                    # Send result message as text tokens so it appears in the chat
                    event_data = {
                        "type": "assistant_token",
                        "payload": {
                            "token": result_message,
                            "messageId": message_id,
                            "isComplete": False,
                        },
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"

            # Send completion token
            completion_event = {
                "type": "assistant_token",
                "payload": {"token": "", "messageId": message_id, "isComplete": True},
            }
            yield f"data: {json.dumps(completion_event)}\n\n"

            logger.info("Chat stream completed, response length: %d", len(full_response))

            # Persist assistant response to conversation history
            if full_response.strip():
                assistant_message = Message(
                    role=MessageRole.ASSISTANT,
                    content=full_response,
                    timestamp=datetime.now(UTC),
                )
                try:
                    await conversation_repo.append_message(
                        conversation_id,
                        assistant_message,
                        user_id,
                    )
                except ValueError as exc:
                    logger.error(
                        "Failed to append assistant message to conversation %s: %s",
                        conversation_id,
                        exc,
                    )

            # Notify frontend about conversation updates
            conversation_event = {
                "type": "conversation_updated",
                "payload": {"conversation_id": conversation_id},
            }
            yield f"data: {json.dumps(conversation_event)}\n\n"

            # Step 2: Extract flows from latest exchange only
            # Skip flow extraction if tools were executed (tools already handled the actions)
            extracted_flows: list[FlowCreate] = []
            if tools_executed:
                logger.info(
                    "Skipping flow extraction because tools were executed (actions already handled)"
                )
            elif not user_message_added:
                logger.info("Skipping flow extraction because no new user message was detected")
            else:
                # Only analyze the most recent user message + assistant response
                # to avoid duplicates
                last_user_message = chat_request.messages[-1]
                conversation_text = f"user: {last_user_message.content}\nassistant: {full_response}"

                logger.info(
                    "Extracting flows from latest exchange: user='%s...', assistant='%s...'",
                    last_user_message.content[:50],
                    full_response[:50],
                )

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
                    normalized_title = _normalize_title(flow.title)
                    dismissed_key = f"dismissed:{chat_request.context_id}:{normalized_title}"
                    dismissed_recently = await dismissed_flow_cache.get(dismissed_key)
                    if dismissed_recently:
                        logger.info(
                            "Skipping creation of flow '%s' (recently dismissed)",
                            flow.title,
                        )
                        continue

                    if normalized_title in existing_title_keys:
                        logger.info(
                            "Skipping creation of flow '%s' (already exists in context)",
                            flow.title,
                        )
                        continue

                    created_flow = await flow_repo.create(
                        user_id=user_id,
                        context_id=chat_request.context_id,
                        flow_data=flow,
                    )
                    if created_flow:
                        created_flows.append(created_flow)
                        existing_title_keys.add(normalized_title)
                except Exception as e:
                    logger.error("Failed to create flow: %s", str(e))
                    # Continue creating other flows

            # Invalidate summary cache if any flows were created
            if created_flows:
                cache_key = f"summary:{chat_request.context_id}"
                await summary_cache.delete(cache_key)
                logger.info(
                    "Invalidated summary cache for context: %s (%d flows created)",
                    chat_request.context_id,
                    len(created_flows),
                )

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
