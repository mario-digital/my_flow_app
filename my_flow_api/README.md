# MyFlow Backend API

**FastAPI** backend with Clean Architecture, MongoDB, Logto authentication, and AI-powered flow management.

---

## 🎯 Quick Links

- [Tech Stack](#tech-stack)
- [Authentication](#authentication-logto--jwt)
- [Architecture](#architecture-clean-architecture)
- [AI Services](#ai-services)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | Python | 3.12+ | Type hints, async/await |
| **Framework** | FastAPI | 0.115+ | Async REST API, auto OpenAPI docs |
| **Database** | MongoDB | 7.x+ | NoSQL document store |
| **DB Driver** | Motor | latest | Async MongoDB driver |
| **Auth** | Logto | Cloud | OAuth 2.0 + JWT validation |
| **AI (Chat)** | OpenAI | latest | GPT-4 for conversational agent |
| **AI (Alternative)** | Anthropic | latest | Claude 3.5 Sonnet support |
| **Package Manager** | uv | latest | Fast Python package manager |
| **Testing** | pytest | latest | Unit + integration tests |
| **Linting** | Ruff | latest | Fast linter + formatter |
| **Type Checking** | mypy | latest | Static type checking |

---

## Authentication (Logto + JWT)

### Overview

MyFlow uses **Logto** for OAuth 2.0 authentication with **JWT token validation** using JWKS (JSON Web Key Set) caching.

### Security Model

```
Next.js (BFF) ──────► FastAPI Backend
              (JWT token in Authorization header)
                     ↓
              Validate JWT using JWKS
                     ↓
              Extract user_id from token
```

- **JWT Tokens**: Validated on every request
- **JWKS Caching**: Public keys cached per-process with TTL
- **Authorization**: User-specific ownership checks

### Backend Auth Implementation

#### 1. Logto Configuration

**File:** `src/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Logto Configuration
    LOGTO_ENDPOINT: str
    LOGTO_APP_ID: str
    LOGTO_APP_SECRET: str
    LOGTO_RESOURCE: str = "https://api.myflow.dev"
    
    # JWT Configuration
    LOGTO_JWKS_CACHE_TTL: int = 3600  # 1 hour cache
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

#### 2. JWT Validation Middleware

**File:** `src/middleware/auth.py`

**Key Features:**
- ✅ JWKS caching with TTL (avoids fetching keys on every request)
- ✅ Thread-safe cache with locks
- ✅ Token verification using `python-jose`
- ✅ User ID extraction from claims
- ✅ Authorization helpers for ownership verification

**Implementation:**

```python
import time
from datetime import datetime, timezone
from functools import wraps
from threading import Lock
from typing import Any

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode

from src.config import settings

# JWKS Cache (per-process, thread-safe)
_jwks_cache: dict[str, Any] = {}
_jwks_cache_lock = Lock()
_jwks_cache_time: float = 0

security = HTTPBearer()


async def get_jwks() -> dict[str, Any]:
    """Get JWKS from Logto, with per-process caching."""
    global _jwks_cache, _jwks_cache_time
    
    current_time = time.time()
    
    # Check cache (thread-safe)
    with _jwks_cache_lock:
        if _jwks_cache and (current_time - _jwks_cache_time) < settings.LOGTO_JWKS_CACHE_TTL:
            return _jwks_cache
    
    # Fetch from Logto
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{settings.LOGTO_ENDPOINT}/oidc/jwks")
        response.raise_for_status()
        jwks = response.json()
    
    # Update cache (thread-safe)
    with _jwks_cache_lock:
        _jwks_cache = jwks
        _jwks_cache_time = current_time
    
    return jwks


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verify JWT token and return user_id.
    
    Raises:
        HTTPException: 401 if token is invalid or expired
    
    Returns:
        str: The user_id extracted from token claims
    """
    token = credentials.credentials
    
    try:
        # Get JWKS (cached)
        jwks = await get_jwks()
        
        # Decode header to get kid (key ID)
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token: missing kid")
        
        # Find matching key
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        
        if not key:
            raise HTTPException(status_code=401, detail="Invalid token: key not found")
        
        # Verify and decode token
        public_key = jwk.construct(key)
        message, encoded_signature = token.rsplit(".", 1)
        decoded_signature = base64url_decode(encoded_signature.encode())
        
        if not public_key.verify(message.encode(), decoded_signature):
            raise HTTPException(status_code=401, detail="Invalid token: signature verification failed")
        
        # Decode claims
        claims = jwt.decode(
            token,
            public_key.to_pem(),
            algorithms=["RS256"],
            audience=settings.LOGTO_RESOURCE,
            issuer=f"{settings.LOGTO_ENDPOINT}/oidc",
        )
        
        # Extract user_id
        user_id = claims.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub claim")
        
        return user_id
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}") from e


# Convenience alias for dependency injection
get_current_user = verify_token
```

**Usage in Routes:**

```python
from typing import Annotated
from fastapi import APIRouter, Depends
from src.middleware.auth import get_current_user

router = APIRouter()

@router.get("/flows")
async def get_flows(
    user_id: Annotated[str, Depends(get_current_user)],
):
    """Get user's flows (JWT validated, user_id extracted)"""
    # user_id is guaranteed to be valid here
    flows = await flow_repository.find_by_user(user_id)
    return flows
```

#### 3. Authorization Helpers

**File:** `src/middleware/auth.py` (continued)

```python
async def verify_context_ownership(
    context_id: str,
    user_id: str,
    context_repo: "ContextRepository",
) -> None:
    """
    Verify that the user owns the specified context.
    
    Raises:
        HTTPException: 404 if context not found or 403 if not owned by user
    """
    context = await context_repo.find_by_id(context_id)
    
    if not context:
        raise HTTPException(status_code=404, detail="Context not found")
    
    if context.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied: not your context")


async def verify_flow_ownership(
    flow_id: str,
    user_id: str,
    flow_repo: "FlowRepository",
) -> None:
    """
    Verify that the user owns the specified flow.
    
    Raises:
        HTTPException: 404 if flow not found or 403 if not owned by user
    """
    flow = await flow_repo.find_by_id(flow_id)
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    if flow.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied: not your flow")
```

**Usage:**

```python
@router.delete("/flows/{flow_id}")
async def delete_flow(
    flow_id: str,
    user_id: Annotated[str, Depends(get_current_user)],
    flow_repo: Annotated[FlowRepository, Depends(get_flow_repository)],
):
    # Verify ownership (raises 403 if not owner)
    await verify_flow_ownership(flow_id, user_id, flow_repo)
    
    # Safe to delete
    await flow_repo.delete(flow_id)
    return {"message": "Flow deleted"}
```

### Authentication Flow Diagram

```
1. Next.js BFF receives request from browser
   ↓
2. Next.js obtains JWT token server-side (from Logto SDK)
   ↓
3. Next.js forwards request to FastAPI with Authorization: Bearer {token}
   ↓
4. FastAPI auth middleware intercepts request
   ↓
5. Middleware fetches JWKS (from cache or Logto)
   ↓
6. Middleware verifies JWT signature using public key
   ↓
7. Middleware decodes token and extracts user_id
   ↓
8. FastAPI route handler receives validated user_id
   ↓
9. Route verifies resource ownership (context/flow belongs to user)
   ↓
10. Route performs operation and returns response
```

**Security Features:**
- 🔒 Every request validates JWT signature
- 🔒 JWKS cached to avoid excessive Logto API calls
- 🔒 User ID extracted from verified token claims
- 🔒 Ownership verified before any CRUD operation
- 🔒 Thread-safe cache for concurrent requests

---

## Architecture (Clean Architecture)

### Layered Structure

MyFlow follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (Routers)                           │
│  - HTTP request/response handling                       │
│  - Input validation (Pydantic)                          │
│  - Dependency injection                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer (Services)                        │
│  - Core business rules                                  │
│  - Orchestration logic                                  │
│  - Transaction management                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Data Access Layer (Repositories)                       │
│  - Database operations                                  │
│  - Query composition                                    │
│  - Data mapping                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  External Services Layer (Adapters)                     │
│  - AI services (OpenAI, Anthropic)                      │
│  - External APIs                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Models)                                  │
│  - Pydantic models                                      │
│  - Business entities                                    │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
my_flow_api/
├── src/
│   ├── main.py                       # FastAPI app initialization
│   ├── config.py                     # Configuration (Pydantic Settings)
│   ├── database.py                   # MongoDB connection & indexes
│   │
│   ├── routers/                      # Presentation Layer
│   │   ├── contexts.py               # Context CRUD endpoints
│   │   ├── flows.py                  # Flow CRUD endpoints
│   │   ├── conversations.py          # Conversation history
│   │   ├── transitions.py            # Context switching suggestions
│   │   └── preferences.py            # User preferences
│   │
│   ├── services/                     # Business Logic Layer
│   │   ├── context_service.py        # Context business logic
│   │   ├── flow_service.py           # Flow business logic
│   │   ├── ai_service.py             # AI chat & flow extraction
│   │   ├── ai_tools.py               # AI function calling registry
│   │   └── transition_service.py     # Context transition intelligence
│   │
│   ├── repositories/                 # Data Access Layer
│   │   ├── context_repository.py     # Context DB operations
│   │   ├── flow_repository.py        # Flow DB operations
│   │   ├── conversation_repository.py # Conversation DB operations
│   │   └── preferences_repository.py # Preferences DB operations
│   │
│   ├── models/                       # Domain Layer
│   │   ├── context.py                # Context models
│   │   ├── flow.py                   # Flow models
│   │   ├── conversation.py           # Conversation models
│   │   └── preferences.py            # Preferences models
│   │
│   └── middleware/                   # Cross-cutting Concerns
│       └── auth.py                   # JWT validation
│
└── tests/                            # Test suites
    ├── unit/                         # Unit tests
    └── integration/                  # Integration tests
```

### Example Flow Through Layers

**Request:** `GET /api/v1/flows?context_id=ctx-123`

```python
# 1. ROUTER (Presentation Layer)
# src/routers/flows.py
@router.get("/")
async def get_flows(
    context_id: str,
    user_id: Annotated[str, Depends(get_current_user)],
    flow_service: Annotated[FlowService, Depends(get_flow_service)],
):
    """Get flows for a context"""
    # Validate and delegate to service
    flows = await flow_service.get_flows(context_id, user_id)
    return flows


# 2. SERVICE (Business Logic Layer)
# src/services/flow_service.py
class FlowService:
    def __init__(self, flow_repo: FlowRepository, context_repo: ContextRepository):
        self.flow_repo = flow_repo
        self.context_repo = context_repo
    
    async def get_flows(self, context_id: str, user_id: str) -> list[FlowWithStatus]:
        # Verify context ownership
        await verify_context_ownership(context_id, user_id, self.context_repo)
        
        # Fetch flows from repository
        flows = await self.flow_repo.find_by_context(context_id)
        
        # Apply business logic (compute status)
        return [self._compute_status(flow) for flow in flows]
    
    def _compute_status(self, flow: Flow) -> FlowWithStatus:
        """Business logic: compute flow status based on due date"""
        if flow.is_completed:
            return FlowWithStatus(**flow.dict(), status="completed")
        
        if flow.due_date and flow.due_date < datetime.now(timezone.utc):
            return FlowWithStatus(**flow.dict(), status="overdue")
        
        return FlowWithStatus(**flow.dict(), status="active")


# 3. REPOSITORY (Data Access Layer)
# src/repositories/flow_repository.py
class FlowRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["flows"]
    
    async def find_by_context(
        self,
        context_id: str,
        completed: bool | None = None,
        priority: str | None = None
    ) -> list[Flow]:
        """Find flows by context with optional filters"""
        query = {"context_id": context_id}
        
        if completed is not None:
            query["is_completed"] = completed
        
        if priority is not None:
            query["priority"] = priority
        
        # Database query
        cursor = self.collection.find(query).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        
        # Map to domain models
        return [Flow(**doc) for doc in docs]
```

**Benefits of This Architecture:**
- ✅ **Testability**: Each layer can be tested independently
- ✅ **Separation of Concerns**: Clear responsibilities
- ✅ **Maintainability**: Changes localized to specific layers
- ✅ **Dependency Injection**: Easy to mock dependencies

---

## AI Services

### Overview

MyFlow includes a **conversational AI agent** with automatic flow extraction and function calling capabilities.

### AI Service Architecture

**File:** `src/services/ai_service.py`

**Capabilities:**
1. **Streaming Chat** - Real-time token-by-token responses
2. **Flow Extraction** - Automatically create tasks from conversation
3. **Function Calling** - AI can mark tasks complete, delete, update priority

### 1. Streaming Chat

**Implementation:**

```python
class AIService:
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        
        if provider == "openai":
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        elif provider == "anthropic":
            self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def stream_chat_response(
        self,
        messages: list[dict],
        context_id: str,
        tools: list[dict] | None = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Stream chat response with optional tool use.
        
        Yields:
            dict: Events of type 'token', 'tool_call', 'done'
        """
        if self.provider == "openai":
            async for event in self._stream_openai(messages, tools):
                yield event
        elif self.provider == "anthropic":
            async for event in self._stream_anthropic(messages, tools):
                yield event
    
    async def _stream_openai(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
    ) -> AsyncGenerator[dict, None]:
        """Stream from OpenAI GPT-4"""
        stream = await self.client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            stream=True,
            tools=tools if tools else None,
        )
        
        async for chunk in stream:
            delta = chunk.choices[0].delta
            
            # Text token
            if delta.content:
                yield {
                    "type": "token",
                    "content": delta.content,
                }
            
            # Tool call
            if delta.tool_calls:
                for tool_call in delta.tool_calls:
                    yield {
                        "type": "tool_call",
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments,
                    }
            
            # Stream finished
            if chunk.choices[0].finish_reason == "stop":
                yield {"type": "done"}
```

**Usage in Router:**

```python
# src/routers/conversations.py
@router.post("/stream")
async def stream_chat(
    chat_request: ChatRequest,
    user_id: Annotated[str, Depends(get_current_user)],
):
    """Stream AI chat response with SSE"""
    ai_service = AIService(provider="openai")
    
    async def generate_sse():
        async for event in ai_service.stream_chat_response(
            messages=chat_request.messages,
            context_id=chat_request.context_id,
        ):
            yield f"data: {json.dumps(event)}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream"
    )
```

### 2. Flow Extraction

**Implementation:**

```python
async def extract_flows_from_text(
    self,
    conversation_text: str,
    context_id: str,
) -> list[FlowCreate]:
    """
    Extract actionable flows from conversation using AI.
    
    Returns:
        list[FlowCreate]: Extracted flows ready to be created
    """
    system_prompt = """
    You are a task extraction assistant. Analyze the conversation and extract actionable tasks.
    
    For each task, provide:
    - title: Clear, concise task description
    - priority: "low", "medium", or "high"
    - due_date: ISO format if mentioned, else null
    
    Return JSON array of tasks.
    """
    
    response = await self.client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": conversation_text},
        ],
        response_format={"type": "json_object"},
    )
    
    # Parse JSON response
    result = json.loads(response.choices[0].message.content)
    flows = result.get("tasks", [])
    
    # Convert to FlowCreate models
    return [
        FlowCreate(
            context_id=context_id,
            title=flow["title"],
            priority=flow.get("priority", "medium"),
            due_date=flow.get("due_date"),
        )
        for flow in flows
    ]
```

### 3. Function Calling (AI Tools)

**File:** `src/services/ai_tools.py`

```python
class AITools:
    """Registry of available AI tools with schemas and executors"""
    
    def __init__(self):
        self._tools = {}
        self._executors = {}
        self._register_tools()
    
    def _register_tools(self):
        # Mark flow complete
        self._tools["mark_flow_complete"] = {
            "type": "function",
            "function": {
                "name": "mark_flow_complete",
                "description": "Mark a flow (task) as complete",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {"type": "string"},
                        "reason": {"type": "string"},
                    },
                    "required": ["flow_id"],
                },
            },
        }
        self._executors["mark_flow_complete"] = self._execute_mark_complete
        
        # Delete flow
        self._tools["delete_flow"] = {
            "type": "function",
            "function": {
                "name": "delete_flow",
                "description": "Delete a flow (task)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {"type": "string"},
                        "reason": {"type": "string"},
                    },
                    "required": ["flow_id"],
                },
            },
        }
        self._executors["delete_flow"] = self._execute_delete
        
        # Update priority
        self._tools["update_flow_priority"] = {
            "type": "function",
            "function": {
                "name": "update_flow_priority",
                "description": "Update a flow's priority",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {"type": "string"},
                        "priority": {"type": "string", "enum": ["low", "medium", "high"]},
                    },
                    "required": ["flow_id", "priority"],
                },
            },
        }
        self._executors["update_flow_priority"] = self._execute_update_priority
    
    async def execute_tool(
        self,
        tool_name: str,
        arguments: dict,
        user_id: str,
        flow_repo: FlowRepository,
    ) -> dict:
        """Execute a tool with ownership verification"""
        if tool_name not in self._executors:
            raise ValueError(f"Unknown tool: {tool_name}")
        
        # Verify flow ownership before execution
        flow_id = arguments.get("flow_id")
        if flow_id:
            await verify_flow_ownership(flow_id, user_id, flow_repo)
        
        # Execute tool
        return await self._executors[tool_name](arguments, flow_repo)
    
    async def _execute_mark_complete(
        self,
        arguments: dict,
        flow_repo: FlowRepository,
    ) -> dict:
        """Execute mark_flow_complete tool"""
        flow_id = arguments["flow_id"]
        
        updated = await flow_repo.update(
            flow_id,
            {"is_completed": True}
        )
        
        return {
            "success": True,
            "message": f"Marked flow {flow_id} as complete",
            "flow": updated.dict(),
        }
```

**Usage in Streaming Response:**

```python
# When AI calls a tool during streaming
if event["type"] == "tool_call":
    tool_name = event["name"]
    arguments = json.loads(event["arguments"])
    
    # Execute tool
    result = await ai_tools.execute_tool(
        tool_name=tool_name,
        arguments=arguments,
        user_id=user_id,
        flow_repo=flow_repo,
    )
    
    # Send tool execution result to client
    yield f"data: {json.dumps({
        'type': 'tool_executed',
        'tool': tool_name,
        'result': result
    })}\n\n"
```

### AI Service Configuration

**Environment Variables:**

```bash
# AI Provider Selection
AI_PROVIDER=openai  # or "anthropic"

# OpenAI
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4  # or "gpt-4-turbo"

# Anthropic (alternative)
ANTHROPIC_API_KEY=your_anthropic_key
AI_MODEL=claude-3-5-sonnet-20241022
```

---

## Data Models & Database Schema

### MongoDB Collections

#### 1. Contexts - User life domains (Work, Personal, Rest, Social)

```javascript
{
  _id: ObjectId,
  user_id: string,       // Logto user ID from JWT
  name: string,          // "Work", "Personal", etc.
  color: string,         // Hex color: "#3B82F6"
  icon: string,          // Emoji: "💼"
  created_at: DateTime,
  updated_at: DateTime
}
```

**Indexes:**
- `user_id` - Fast user lookup
- `(user_id, created_at desc)` - Sorted listing

---

#### 2. Flows - Actionable tasks within contexts

```javascript
{
  _id: ObjectId,
  context_id: ObjectId,  // Parent context reference
  user_id: string,       // For authorization
  title: string,         // Task description
  description?: string,  // Optional details
  priority: "low" | "medium" | "high",
  is_completed: boolean,
  due_date?: DateTime,   // Optional deadline
  reminder_enabled: boolean,
  created_at: DateTime,
  updated_at: DateTime,
  completed_at?: DateTime
}
```

**Indexes:**
- `context_id` - Flows within context
- `user_id` - User-level queries
- `(context_id, is_completed, priority)` - Filtered queries
- `(context_id, due_date, is_completed)` - Due date queries
- `(user_id, due_date, is_completed)` - Cross-context reminders

---

#### 3. UserPreferences - App settings per user

```javascript
{
  _id: ObjectId,
  user_id: string,                     // Unique index
  onboarding_completed: boolean,       // Has user completed onboarding flow
  onboarding_completed_at?: DateTime,  // When onboarding was completed
  current_context_id?: string,         // Last active context
  theme?: "light" | "dark" | "system", // UI theme preference
  notifications_enabled: boolean,      // Global notification toggle
  created_at: DateTime,
  updated_at: DateTime
}
```

**Indexes:**
- `user_id` (unique) - One preferences doc per user

---

#### 4. Conversations - AI chat history

```javascript
{
  _id: ObjectId,
  context_id: string,        // Parent context reference (string, not ObjectId)
  user_id: string,           // For authorization
  messages: Array<{
    role: "user" | "assistant" | "system",
    content: string,         // Max 10,000 characters
    timestamp: DateTime | null  // Auto-set if not provided
  }>,
  created_at: DateTime,
  updated_at: DateTime
}
```

**Indexes:**
- `user_id` - User isolation queries
- `context_id` - Context's conversation history
- `(user_id, context_id)` - User's conversations in specific context
- `(context_id, updated_at desc)` - Recent conversations per context
- `(user_id, _id)` - Efficient user-scoped lookups

---

### Index Creation

All indexes are automatically created on application startup via `src/database.py`:

```python
async def ensure_indexes():
    """Create all required indexes for optimal query performance"""
    db = get_database()
    
    # Contexts indexes
    await db["contexts"].create_index("user_id")
    await db["contexts"].create_index([("user_id", 1), ("created_at", -1)])
    
    # Flows indexes
    await db["flows"].create_index("context_id")
    await db["flows"].create_index("user_id")
    await db["flows"].create_index([
        ("context_id", 1),
        ("is_completed", 1),
        ("priority", 1)
    ])
    await db["flows"].create_index([
        ("context_id", 1),
        ("due_date", 1),
        ("is_completed", 1)
    ])
    await db["flows"].create_index([
        ("user_id", 1),
        ("due_date", 1),
        ("is_completed", 1)
    ])
    
    # User preferences indexes
    await db["user_preferences"].create_index("user_id", unique=True)
    
    # Conversations indexes
    await db["conversations"].create_index("user_id")
    await db["conversations"].create_index("context_id")
    await db["conversations"].create_index([("user_id", 1), ("context_id", 1)])
    await db["conversations"].create_index([("context_id", 1), ("updated_at", -1)])
```

---

## Setup

### Prerequisites

- **Python 3.12+**
- **uv** package manager
- **MongoDB Atlas** account (free tier)
- **1Password CLI** (`op`) for secrets
- **Logto Account** for authentication
- **OpenAI or Anthropic API Key** for AI features

### Installation

```bash
# From root directory
cd my_flow_api

# Install dependencies
uv sync
```

### MongoDB Atlas Setup

1. **Create Cluster**: Sign up at https://www.mongodb.com/cloud/atlas
2. **Choose M0 Free Tier**: 512MB storage
3. **Create Database User**: Security → Database Access
4. **Whitelist IP**: Security → Network Access → Add 0.0.0.0/0 (dev only)
5. **Get Connection String**: Deployment → Database → Connect
   ```
   mongodb+srv://username:password@cluster.mongodb.net/myflow
   ```
6. **Store in 1Password**:
   - Vault: `my_flow_secrets`
   - Item: `myflow_mongodb`
   - Fields: `MONGODB_URI`, `MONGODB_DB_NAME`

### Environment Variables

**Required (in `.env.template` with 1Password references):**

```bash
# MongoDB
MONGODB_URI=op://my_flow_secrets/myflow_mongodb/MONGODB_URI
MONGODB_DB_NAME=op://my_flow_secrets/myflow_mongodb/MONGODB_DB_NAME

# Application
ENV=development
PROJECT_NAME=MyFlow API
VERSION=0.1.0

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Logto
LOGTO_ENDPOINT=op://my_flow_secrets/logto/LOGTO_ENDPOINT
LOGTO_APP_ID=op://my_flow_secrets/logto/LOGTO_APP_ID
LOGTO_APP_SECRET=op://my_flow_secrets/logto/LOGTO_APP_SECRET
LOGTO_RESOURCE=https://api.myflow.dev

# AI Provider
AI_PROVIDER=openai  # or "anthropic"
OPENAI_API_KEY=op://my_flow_secrets/openai/OPENAI_API_KEY
AI_MODEL=gpt-4
```

### Running the API

```bash
# Development with 1Password (recommended)
./dev.sh

# Or manually
op run --env-file=../.env.template -- uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**API will be available at:** `http://localhost:8000`

---

## API Endpoints

### Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Production**: (Your domain)/api/v1

### Documentation

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### Endpoints Overview

#### Contexts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contexts` | Get all contexts for user |
| POST | `/contexts` | Create new context |
| GET | `/contexts/{id}` | Get context by ID |
| PUT | `/contexts/{id}` | Update context |
| DELETE | `/contexts/{id}` | Delete context |
| GET | `/contexts/summaries` | Get context summaries with flow counts |

#### Flows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flows?context_id={id}` | Get flows for context |
| POST | `/flows` | Create new flow |
| GET | `/flows/{id}` | Get flow by ID |
| PUT | `/flows/{id}` | Update flow |
| DELETE | `/flows/{id}` | Delete flow |
| PATCH | `/flows/{id}/complete` | Toggle flow completion |

#### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations/stream` | Stream AI chat (SSE) |
| GET | `/conversations?context_id={id}` | Get conversation history |

#### Transitions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transitions/suggestions?from={id}&to={id}` | Get context switch suggestions |
| GET | `/transitions/warnings/{context_id}` | Get incomplete flow warnings |

#### User Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preferences` | Get user preferences |
| PUT | `/preferences` | Update preferences |

### Example Requests

**Create Flow:**

```bash
curl -X POST http://localhost:8000/api/v1/flows \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "context_id": "ctx-123",
    "title": "Finish project documentation",
    "priority": "high",
    "due_date": "2024-12-31T23:59:59Z"
  }'
```

**Stream Chat:**

```bash
curl -N http://localhost:8000/api/v1/conversations/stream \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "context_id": "ctx-123",
    "messages": [
      {"role": "user", "content": "I need to finish the docs and call the client"}
    ]
  }'
```

---

## Testing

### Test Strategy (70/20/10 Pyramid)

- **70% Unit Tests** - Services, repositories, utilities
- **20% Integration Tests** - API endpoints with test DB
- **10% E2E Tests** - Full user flows (handled by frontend)

### Running Tests

```bash
# All tests
uv run pytest

# With coverage
uv run pytest --cov=src --cov-report=html

# Specific test file
uv run pytest tests/unit/test_flow_service.py

# Specific test
uv run pytest tests/unit/test_flow_service.py::test_get_flows_success
```

### Unit Tests Example

```python
# tests/unit/test_flow_service.py
import pytest
from unittest.mock import AsyncMock, Mock
from src.services.flow_service import FlowService
from src.models.flow import Flow

@pytest.mark.asyncio
async def test_get_flows_success():
    # Arrange
    flow_repo = Mock()
    flow_repo.find_by_context = AsyncMock(return_value=[
        Flow(id="1", title="Task 1", context_id="ctx-1", user_id="user-1")
    ])
    
    context_repo = Mock()
    context_repo.find_by_id = AsyncMock(return_value=
        Mock(user_id="user-1")
    )
    
    service = FlowService(flow_repo, context_repo)
    
    # Act
    flows = await service.get_flows("ctx-1", "user-1")
    
    # Assert
    assert len(flows) == 1
    assert flows[0].title == "Task 1"
    flow_repo.find_by_context.assert_awaited_once_with("ctx-1")
```

### Integration Tests Example

```python
# tests/integration/test_flows_api.py
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.mark.asyncio
async def test_create_flow_endpoint(test_db, auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/flows",
            json={
                "context_id": "ctx-123",
                "title": "Test Task",
                "priority": "high"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["priority"] == "high"
```

### Coverage Requirements

- **Line Coverage:** ≥ 80%
- **Branch Coverage:** ≥ 80%

---

## Code Quality

### Linting (Ruff)

```bash
uv run ruff check src/       # Check for issues
uv run ruff check src/ --fix # Auto-fix issues
```

### Formatting (Ruff)

```bash
uv run ruff format src/       # Format code
```

### Type Checking (mypy)

```bash
uv run mypy src/              # Type check
```

**Configuration:** `mypy.ini`

---

## Available Scripts

### Development
```bash
./dev.sh                      # Start dev server with 1Password
uv run uvicorn src.main:app --reload  # Without 1Password
```

### Testing
```bash
uv run pytest                 # All tests
uv run pytest --cov=src       # With coverage
uv run pytest -v              # Verbose
uv run pytest -k "test_flows" # Specific tests
```

### Code Quality
```bash
uv run ruff check src/        # Lint
uv run ruff format src/       # Format
uv run mypy src/              # Type check
```

---

## Additional Resources

- **Root README:** [../README.md](../README.md) - High-level project overview
- **Frontend README:** [../my_flow_client/README.md](../my_flow_client/README.md) - Next.js frontend details
- **Architecture Docs:** [../docs/architecture/](../docs/architecture/) - Detailed technical documentation

---

## Support

For issues or questions:
- Check the [Architecture Documentation](../docs/architecture/)
- Review the [Root README](../README.md)
- Consult the [Frontend README](../my_flow_client/README.md)
