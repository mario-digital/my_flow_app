# Epic 3: AI Conversational Interface & Flow Extraction

**Epic Goal:** Implement AI chat interface with streaming responses and automatic flow extraction from conversation. Users can converse naturally and see flows appear automatically.

**API Contract:**
```
POST   /api/chat/stream           → WebSocket or SSE for AI streaming
POST   /api/chat/extract-flows    → Extract flows from conversation
GET    /api/conversations/{id}    → Get conversation history
```

**Parallel Work Sections:**
- **Backend (Stories 3.1-3.4):** AI service integration, conversation storage, flow extraction
- **Frontend (Stories 3.5-3.8):** Chat UI, streaming message display, flow extraction feedback

---

## Story 3.1: OpenAI/Anthropic SDK Integration & Streaming Service

**As a** backend developer,
**I want** AI SDK configured with streaming support,
**so that** the backend can generate real-time conversational responses.

### Acceptance Criteria

1. **AI service client created in `my_flow_api/app/services/ai_service.py`:**
   - Configurable provider (OpenAI GPT-4 or Anthropic Claude 3.5) via environment variable
   - `AIService` class with methods: `stream_chat_response()`, `extract_flows_from_text()`
   - Uses async streaming for chat responses (OpenAI: `openai.AsyncStream`, Anthropic: `anthropic.AsyncStream`)

2. **Streaming implementation:**
   - `stream_chat_response(messages: List[Message], context_id: str) -> AsyncGenerator[str, None]`
   - Yields token-by-token response
   - Includes context-specific system prompts (e.g., "You are an assistant for the user's Work context")
   - Handles API errors gracefully (rate limits, timeouts, invalid API keys)

3. **Configuration via 1Password:**
   - API key stored in 1Password vault: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - Provider selection: `AI_PROVIDER=openai` or `AI_PROVIDER=anthropic`
   - Model configuration: `AI_MODEL=gpt-4` or `AI_MODEL=claude-3-5-sonnet-20241022`

4. **Unit tests created in `my_flow_api/tests/test_services/test_ai_service.py`:**
   - Tests streaming with mock AI responses
   - Tests error handling (invalid API keys, timeout)
   - Tests provider switching (OpenAI vs Anthropic)
   - At least 80% coverage

5. **Manual testing with 1Password:**
   - Can run `op run -- uvicorn main:app --reload` and invoke AI service
   - Streaming responses work correctly

---

## Story 3.2: Conversation Storage & Retrieval (MongoDB)

**As a** backend developer,
**I want** conversation history stored in MongoDB with message threading,
**so that** users can review past conversations and maintain context.

### Acceptance Criteria

1. **Pydantic models created in `my_flow_api/app/models/conversation.py`:**
   - `Message` model: `role` (Literal["user", "assistant", "system"]), `content` (str), `timestamp` (datetime)
   - `Conversation` model: `id` (ObjectId), `context_id` (ObjectId), `messages` (List[Message]), `created_at`, `updated_at`
   - Validators for role enum and message content length

2. **Repository created in `my_flow_api/app/repositories/conversation_repository.py`:**
   - `ConversationRepository` class with methods:
     - `create_conversation(context_id: str) -> ConversationInDB`
     - `get_conversation_by_id(conversation_id: str) -> Optional[ConversationInDB]`
     - `get_conversations_by_context(context_id: str) -> List[ConversationInDB]`
     - `append_message(conversation_id: str, message: Message) -> ConversationInDB`
     - `get_recent_messages(conversation_id: str, limit: int = 20) -> List[Message]`

3. **MongoDB indexes:**
   - Conversations collection: Index on `context_id`, compound index on `(context_id, updated_at desc)`
   - Efficient retrieval of recent conversations per context

4. **Integration tests created in `my_flow_api/tests/test_repositories/test_conversation_repository.py`:**
   - Tests conversation creation and message appending
   - Tests retrieval of recent messages
   - Tests pagination
   - At least 85% coverage

---

## Story 3.3: Flow Extraction from Conversation (AI-Powered)

**As a** backend developer,
**I want** AI to extract actionable flows from conversation text,
**so that** flows are automatically created without manual user input.

### Acceptance Criteria

1. **Flow extraction method in `my_flow_api/app/services/ai_service.py`:**
   - `extract_flows_from_text(conversation_text: str, context_id: str) -> List[FlowCreate]`
   - Uses AI to identify actionable tasks/flows from conversation
   - Returns structured `FlowCreate` objects with `title`, `description`, `priority`
   - Uses specific prompt engineering: "Extract actionable tasks from the following conversation. Return JSON array of tasks with title, description, and priority (low/medium/high)."

2. **JSON parsing and validation:**
   - AI response parsed as JSON
   - Pydantic validates extracted flows before returning
   - Handles malformed JSON gracefully (returns empty list if parsing fails)

3. **Automatic flow creation integration:**
   - After AI streaming completes, backend calls `extract_flows_from_text()`
   - Extracted flows automatically inserted into database via `FlowRepository.create()`
   - User notified via WebSocket/SSE event: `{"event": "flows_extracted", "flows": [...]}`

4. **Unit tests created in `my_flow_api/tests/test_services/test_flow_extraction.py`:**
   - Tests extraction with sample conversation text
   - Tests JSON parsing edge cases (malformed JSON, empty responses)
   - Tests automatic flow creation
   - At least 80% coverage

5. **Manual testing:**
   - Conversation "I need to finish the presentation, call the client, and book a flight" extracts 3 flows
   - Each flow has appropriate title, description, and priority

---

## Story 3.4: Chat Streaming API Endpoint (WebSocket or SSE)

**As a** backend developer,
**I want** a streaming API endpoint for AI chat,
**so that** the frontend receives real-time token-by-token responses.

### Acceptance Criteria

1. **WebSocket endpoint created in `my_flow_api/app/api/v1/chat.py`:**
   - `POST /api/v1/chat/stream` (WebSocket or Server-Sent Events)
   - Accepts: `{"context_id": str, "message": str, "conversation_id": Optional[str]}`
   - Streams AI response token-by-token to client
   - After streaming completes, extracts flows and sends `{"event": "flows_extracted", "flows": [...]}`

2. **Authentication enforced:**
   - Requires valid Logto JWT token
   - Verifies user owns the context before streaming

3. **Error handling:**
   - Returns appropriate error codes for invalid context, AI service failures
   - Gracefully handles WebSocket disconnections

4. **Integration tests created in `my_flow_api/tests/test_api/test_chat.py`:**
   - Tests WebSocket/SSE connection and streaming
   - Tests flow extraction after streaming
   - Tests authentication (401, 403 responses)
   - At least 80% coverage

5. **Manual testing with 1Password:**
   - Can run `op run -- uvicorn main:app --reload` and test streaming with WebSocket client (e.g., `websocat`)
   - Streaming responses and flow extraction work end-to-end

---

## Story 3.5: Chat UI Component (shadcn/ui)

**As a** frontend developer,
**I want** a chat interface component with message history,
**so that** users can converse with the AI assistant.

### Acceptance Criteria

1. **Chat component created in `my_flow_client/components/chat/chat-interface.tsx`:**
   - Uses shadcn/ui `ScrollArea` for message history
   - Message bubbles styled differently for user vs assistant (user=right-aligned accent color, assistant=left-aligned secondary bg)
   - Input field at bottom with shadcn/ui `Textarea` and send button
   - Auto-scrolls to bottom when new messages arrive

2. **Message component created in `my_flow_client/components/chat/message-bubble.tsx`:**
   - Displays message content with proper formatting (markdown support via `react-markdown`)
   - Shows timestamp and role indicator (user icon vs AI icon)
   - Typing indicator for assistant messages in progress

3. **Styling uses CSS design tokens:**
   - User message bubbles use `var(--color-accent-work)` (or context-specific color)
   - Assistant bubbles use `var(--color-bg-secondary)`
   - Text uses `var(--color-text-primary)`
   - Spacing and borders use design tokens

4. **Component props typed with TypeScript:**
   ```typescript
   interface ChatInterfaceProps {
     contextId: string;
     conversationId?: string;
     onFlowsExtracted: (flows: Flow[]) => void;
     className?: string;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/chat/chat-interface.test.tsx`:**
   - Tests rendering with mock messages
   - Tests user input and send button
   - Tests auto-scroll behavior
   - At least 80% coverage

6. **Storybook story created:**
   - Shows empty chat state
   - Shows conversation with 5 messages (mixed user/assistant)
   - Shows typing indicator
   - Dark mode only

---

## Story 3.6: WebSocket/SSE Client for AI Streaming

**As a** frontend developer,
**I want** a WebSocket/SSE client hook for AI streaming,
**so that** messages stream in real-time as the AI generates them.

### Acceptance Criteria

1. **WebSocket client hook created in `my_flow_client/hooks/use-chat-stream.ts`:**
   - `useChatStream(contextId: string, conversationId?: string)`
   - Opens WebSocket connection to `/api/v1/chat/stream`
   - Sends user message via WebSocket
   - Receives streaming tokens and appends to current assistant message
   - Handles `flows_extracted` event and calls callback

2. **Streaming state management:**
   - Returns `{ messages, sendMessage, isStreaming, error }`
   - `isStreaming` is true while AI is generating response
   - `error` contains any connection or API errors

3. **Authentication:**
   - Includes Logto JWT token in WebSocket connection headers
   - Automatically reconnects if connection drops (max 3 retries)

4. **Integration with TanStack Query:**
   - After flow extraction event, invalidates `flowKeys.list(contextId)` to refresh flow list
   - Optimistic UI update shows extracted flows immediately

5. **Integration tests created in `my_flow_client/__tests__/hooks/use-chat-stream.test.tsx`:**
   - Uses mock WebSocket server for testing
   - Tests sending message and receiving streamed response
   - Tests flow extraction event handling
   - Tests error handling and reconnection
   - At least 80% coverage

6. **Manual testing with 1Password:**
   - Can run `op run -- bun dev` and test streaming in browser
   - Messages stream smoothly without flickering
   - Flow extraction notifications appear correctly

---

## Story 3.7: Flow Extraction Feedback UI

**As a** frontend developer,
**I want** visual feedback when flows are extracted from conversation,
**so that** users understand what the AI has created.

### Acceptance Criteria

1. **Flow extraction notification component created in `my_flow_client/components/chat/flow-extraction-notification.tsx`:**
   - Uses shadcn/ui `Toast` or inline notification banner
   - Shows: "🎯 Extracted 3 flows from conversation"
   - Click to expand and preview extracted flows
   - "Add All" button to confirm, "Dismiss" to ignore

2. **Flow preview card created:**
   - Mini flow cards showing title, description, priority
   - Uses CSS design tokens for priority colors
   - Hover state shows full description

3. **Optimistic UI update:**
   - Extracted flows appear in flow list immediately (before user confirms)
   - If user dismisses, flows are removed from UI and backend (DELETE request)

4. **Styling uses CSS design tokens:**
   - Notification background uses `var(--color-bg-secondary)`
   - Success indicator uses `var(--color-accent-work)` or context color
   - Spacing and borders use tokens

5. **Unit tests created in `my_flow_client/__tests__/components/chat/flow-extraction-notification.test.tsx`:**
   - Tests rendering with mock extracted flows
   - Tests "Add All" and "Dismiss" actions
   - Tests callback functions
   - At least 80% coverage

6. **Storybook story created:**
   - Shows notification with 1 flow
   - Shows notification with 5 flows
   - Shows expanded preview state

---

## Story 3.8: Chat Integration with Context Switcher

**As a** frontend developer,
**I want** chat history to persist per context and clear when switching contexts,
**so that** conversations are organized by context.

### Acceptance Criteria

1. **Context-aware chat state:**
   - Chat component receives `contextId` prop from parent
   - When `contextId` changes, chat clears current messages and loads conversation history for new context
   - Uses `useEffect` to trigger conversation loading on context switch

2. **Conversation history loading:**
   - API client method created: `fetchConversationHistory(contextId: string) -> Conversation[]`
   - TanStack Query hook: `useConversationHistory(contextId: string)`
   - Loads most recent conversation for context on mount
   - Displays loading skeleton while fetching

3. **Chat persistence:**
   - Messages are automatically saved to backend after each send/receive
   - No manual save button required
   - Conversation history survives page refresh, up to 50 recent messages (API hard limit)

4. **Integration with Context Switcher:**
   - When user switches context, chat immediately clears and shows loading state
   - New conversation history loads within 200ms (cached by TanStack Query)
   - Smooth transition with no flickering

5. **Integration tests created in `my_flow_client/__tests__/integration/context-chat-integration.test.tsx`:**
   - Tests switching contexts and chat clearing
   - Tests conversation history loading
   - Tests persistence across refreshes
   - At least 80% coverage

6. **Manual testing with 1Password:**
   - Can run `op run -- bun dev` and test context switching with chat
   - Chat history loads correctly for each context
   - Switching feels instant and smooth

---
