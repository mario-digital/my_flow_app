# Backend Architecture

This section provides FastAPI-specific architecture details, focusing on async operations, repository pattern, and MongoDB integration.

## Service Organization

```
my_flow_api/
├── src/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Configuration and settings
│   ├── database.py              # MongoDB connection setup
│   │
│   ├── models/                  # Pydantic models
│   │   ├── __init__.py
│   │   ├── context.py           # Context schemas
│   │   ├── flow.py              # Flow schemas
│   │   ├── preferences.py       # UserPreferences schemas
│   │   └── conversation.py      # Conversation schemas (future)
│   │
│   ├── routers/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── contexts.py          # Context CRUD endpoints
│   │   ├── flows.py             # Flow CRUD + due date endpoints
│   │   ├── preferences.py       # UserPreferences endpoints
│   │   └── ai.py                # AI chat endpoints (future)
│   │
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── context_service.py   # Context business logic
│   │   ├── flow_service.py      # Flow business logic + status computation
│   │   ├── preferences_service.py # Preferences business logic
│   │   └── ai_service.py        # AI orchestration (future)
│   │
│   ├── repositories/            # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py              # Base repository with common CRUD
│   │   ├── context_repository.py
│   │   ├── flow_repository.py
│   │   └── preferences_repository.py
│   │
│   ├── middleware/              # Request/response middleware
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT validation
│   │   ├── cors.py              # CORS configuration
│   │   └── logging.py           # Request logging
│   │
│   ├── adapters/                # External service integrations
│   │   ├── __init__.py
│   │   └── ai_provider.py       # OpenAI/Anthropic adapter (future)
│   │
│   └── utils/                   # Utility functions
│       ├── __init__.py
│       ├── datetime_utils.py    # Date/time helpers
│       └── exceptions.py        # Custom exception classes
│
├── tests/                       # Test suite
│   ├── unit/
│   │   ├── test_services.py
│   │   └── test_repositories.py
│   ├── integration/
│   │   └── test_routers.py
│   └── conftest.py              # Pytest fixtures
│
├── alembic/                     # Database migrations (if needed)
├── .env.example                 # Environment variable template
├── pyproject.toml               # Poetry/uv dependencies
├── Dockerfile                   # Railway deployment
└── README.md
```

## FastAPI Application Entry Point

**main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import settings
from src.database import connect_to_mongo, close_mongo_connection
from src.routers import contexts, flows, preferences
from src.middleware.logging import RequestLoggingMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await connect_to_mongo()
    print("✅ Connected to MongoDB")

    yield

    # Shutdown
    await close_mongo_connection()
    print("✅ Closed MongoDB connection")

app = FastAPI(
    title="My Flow API",
    version="1.0.0",
    description="Context-aware task management API",
    lifespan=lifespan,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Health check endpoint (no auth required)
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include routers
app.include_router(contexts.router, prefix="/api/v1", tags=["Contexts"])
app.include_router(flows.router, prefix="/api/v1", tags=["Flows"])
app.include_router(preferences.router, prefix="/api/v1", tags=["Preferences"])
```

## Configuration Management

**config.py:**
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "myflow"

    # Logto Authentication
    LOGTO_ENDPOINT: str
    LOGTO_APP_ID: str
    LOGTO_APP_SECRET: str

    # AI Provider (Future)
    AI_PROVIDER: str = "openai"  # or "anthropic"
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()

settings = get_settings()
```

## Database Connection Setup

**database.py:**
```python
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from src.config import settings

class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

db_instance = MongoDB()

async def connect_to_mongo():
    """Initialize MongoDB connection."""
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]

    # Create indexes
    await create_indexes()

async def close_mongo_connection():
    """Close MongoDB connection."""
    if db_instance.client:
        db_instance.client.close()

async def get_database() -> AsyncIOMotorDatabase:
    """Dependency for accessing database."""
    return db_instance.db

async def create_indexes():
    """Create MongoDB indexes for performance."""
    db = db_instance.db

    # Contexts collection
    await db.contexts.create_index("user_id")
    await db.contexts.create_index([("user_id", 1), ("created_at", -1)])

    # Flows collection
    await db.flows.create_index("context_id")
    await db.flows.create_index("user_id")
    await db.flows.create_index([("context_id", 1), ("is_completed", 1), ("priority", 1)])
    await db.flows.create_index([("context_id", 1), ("due_date", 1), ("is_completed", 1)])
    await db.flows.create_index([("user_id", 1), ("due_date", 1), ("is_completed", 1)])

    # UserPreferences collection
    await db.user_preferences.create_index("user_id", unique=True)
```

## Pydantic Models (Request/Response Schemas)

**models/context.py:**
```python
from pydantic import BaseModel, Field
from datetime import datetime

class ContextBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: str = Field(..., min_length=1, max_length=10)

class ContextCreate(ContextBase):
    """Schema for creating a context."""
    pass

class ContextUpdate(BaseModel):
    """Schema for updating a context (partial)."""
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: str | None = Field(None, min_length=1, max_length=10)

class Context(ContextBase):
    """Complete context schema with DB fields."""
    id: str = Field(..., alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "logto_user_abc123",
                "name": "Work",
                "color": "#3B82F6",
                "icon": "💼",
                "created_at": "2025-09-30T10:00:00Z",
                "updated_at": "2025-09-30T10:00:00Z",
            }
        }
```

**models/flow.py:**
```python
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class FlowStatus(str, Enum):
    OVERDUE = "overdue"
    DUE_TODAY = "due_today"
    DUE_SOON = "due_soon"
    NORMAL = "normal"

class FlowBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    due_date: datetime | None = None
    reminder_enabled: bool = True

class FlowCreate(FlowBase):
    context_id: str

class FlowUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    priority: Priority | None = None
    due_date: datetime | None = None
    reminder_enabled: bool | None = None

class Flow(FlowBase):
    id: str = Field(..., alias="_id")
    context_id: str
    user_id: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

    class Config:
        populate_by_name = True

class FlowWithStatus(Flow):
    """Flow with computed status fields."""
    status: FlowStatus
    days_until_due: int | None = None
```

## Repository Layer (Data Access)

**repositories/base.py:**
```python
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import TypeVar, Generic, Type
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str, model: Type[ModelType]):
        self.collection = db[collection_name]
        self.model = model

    async def find_by_id(self, doc_id: str) -> ModelType | None:
        """Find document by ID."""
        doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
        return self.model(**doc) if doc else None

    async def create(self, data: dict) -> ModelType:
        """Insert new document."""
        data["created_at"] = datetime.utcnow()
        data["updated_at"] = datetime.utcnow()

        result = await self.collection.insert_one(data)
        doc = await self.collection.find_one({"_id": result.inserted_id})
        return self.model(**doc)

    async def update(self, doc_id: str, data: dict) -> ModelType | None:
        """Update document by ID."""
        data["updated_at"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(doc_id)},
            {"$set": data},
            return_document=True
        )
        return self.model(**result) if result else None

    async def delete(self, doc_id: str) -> bool:
        """Delete document by ID."""
        result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0
```

**repositories/flow_repository.py:**
```python
from src.repositories.base import BaseRepository
from src.models.flow import Flow, FlowCreate
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta

class FlowRepository(BaseRepository[Flow]):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "flows", Flow)

    async def find_by_context(
        self,
        context_id: str,
        completed: bool | None = None,
        priority: str | None = None
    ) -> list[Flow]:
        """Find flows by context with optional filters."""
        query = {"context_id": context_id}

        if completed is not None:
            query["is_completed"] = completed
        if priority:
            query["priority"] = priority

        cursor = self.collection.find(query).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        return [Flow(**doc) for doc in docs]

    async def find_due_flows(
        self,
        user_id: str,
        days: int = 7,
        include_overdue: bool = True
    ) -> list[Flow]:
        """Find flows with upcoming due dates."""
        now = datetime.utcnow()
        future = now + timedelta(days=days)

        query = {
            "user_id": user_id,
            "is_completed": False,
            "due_date": {"$ne": None}
        }

        if include_overdue:
            query["due_date"]["$lte"] = future
        else:
            query["due_date"]["$gte"] = now
            query["due_date"]["$lte"] = future

        cursor = self.collection.find(query).sort("due_date", 1)
        docs = await cursor.to_list(length=100)
        return [Flow(**doc) for doc in docs]

    async def toggle_completion(self, flow_id: str) -> Flow | None:
        """Toggle flow completion status."""
        doc = await self.collection.find_one({"_id": ObjectId(flow_id)})
        if not doc:
            return None

        new_status = not doc["is_completed"]
        completed_at = datetime.utcnow() if new_status else None

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(flow_id)},
            {
                "$set": {
                    "is_completed": new_status,
                    "completed_at": completed_at,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )
        return Flow(**result) if result else None
```

## Service Layer (Business Logic)

**services/flow_service.py:**
```python
from src.repositories.flow_repository import FlowRepository
from src.repositories.context_repository import ContextRepository
from src.models.flow import FlowCreate, FlowUpdate, Flow, FlowWithStatus, FlowStatus
from datetime import datetime

class FlowService:
    def __init__(self, flow_repo: FlowRepository, context_repo: ContextRepository):
        self.flow_repo = flow_repo
        self.context_repo = context_repo

    async def get_flows(
        self,
        context_id: str,
        user_id: str,
        completed: bool | None = None,
        priority: str | None = None
    ) -> list[FlowWithStatus]:
        """Get flows for context with status computation."""
        # Verify context ownership
        context = await self.context_repo.find_by_id(context_id)
        if not context or context.user_id != user_id:
            raise ValueError("Context not found or unauthorized")

        flows = await self.flow_repo.find_by_context(context_id, completed, priority)
        return [self._compute_status(flow) for flow in flows]

    async def get_due_flows(self, user_id: str, days: int = 7) -> list[FlowWithStatus]:
        """Get flows with upcoming due dates."""
        flows = await self.flow_repo.find_due_flows(user_id, days)
        return [self._compute_status(flow) for flow in flows]

    async def create_flow(self, user_id: str, flow_data: FlowCreate) -> Flow:
        """Create new flow after context validation."""
        # Verify context ownership
        context = await self.context_repo.find_by_id(flow_data.context_id)
        if not context or context.user_id != user_id:
            raise ValueError("Context not found or unauthorized")

        data = flow_data.model_dump()
        data["user_id"] = user_id
        data["is_completed"] = False

        return await self.flow_repo.create(data)

    async def toggle_completion(self, flow_id: str, user_id: str) -> Flow:
        """Toggle flow completion with ownership check."""
        flow = await self.flow_repo.find_by_id(flow_id)
        if not flow or flow.user_id != user_id:
            raise ValueError("Flow not found or unauthorized")

        updated = await self.flow_repo.toggle_completion(flow_id)
        if not updated:
            raise ValueError("Failed to update flow")

        return updated

    def _compute_status(self, flow: Flow) -> FlowWithStatus:
        """Compute status and days_until_due for a flow."""
        if not flow.due_date:
            return FlowWithStatus(
                **flow.model_dump(),
                status=FlowStatus.NORMAL,
                days_until_due=None
            )

        now = datetime.utcnow()
        delta = (flow.due_date - now).days

        if delta < 0:
            status = FlowStatus.OVERDUE
        elif delta == 0:
            status = FlowStatus.DUE_TODAY
        elif delta <= 3:
            status = FlowStatus.DUE_SOON
        else:
            status = FlowStatus.NORMAL

        return FlowWithStatus(
            **flow.model_dump(),
            status=status,
            days_until_due=delta
        )
```

## Router Layer (API Endpoints)

**routers/flows.py:**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from src.models.flow import FlowCreate, FlowUpdate, Flow, FlowWithStatus
from src.services.flow_service import FlowService
from src.middleware.auth import get_current_user
from src.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()

async def get_flow_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> FlowService:
    """Dependency injection for FlowService."""
    from src.repositories.flow_repository import FlowRepository
    from src.repositories.context_repository import ContextRepository

    flow_repo = FlowRepository(db)
    context_repo = ContextRepository(db)
    return FlowService(flow_repo, context_repo)

@router.get("/contexts/{context_id}/flows", response_model=list[FlowWithStatus])
async def list_flows(
    context_id: str,
    completed: bool | None = None,
    priority: str | None = None,
    user_id: str = Depends(get_current_user),
    service: FlowService = Depends(get_flow_service)
):
    """List flows for a context."""
    try:
        return await service.get_flows(context_id, user_id, completed, priority)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/contexts/{context_id}/flows", response_model=Flow, status_code=status.HTTP_201_CREATED)
async def create_flow(
    context_id: str,
    flow_data: FlowCreate,
    user_id: str = Depends(get_current_user),
    service: FlowService = Depends(get_flow_service)
):
    """Create a new flow."""
    if flow_data.context_id != context_id:
        raise HTTPException(status_code=400, detail="Context ID mismatch")

    try:
        return await service.create_flow(user_id, flow_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/flows/due", response_model=list[FlowWithStatus])
async def get_due_flows(
    days: int = 7,
    user_id: str = Depends(get_current_user),
    service: FlowService = Depends(get_flow_service)
):
    """Get flows with upcoming due dates."""
    return await service.get_due_flows(user_id, days)

@router.post("/flows/{flow_id}/complete", response_model=Flow)
async def toggle_flow_completion(
    flow_id: str,
    user_id: str = Depends(get_current_user),
    service: FlowService = Depends(get_flow_service)
):
    """Toggle flow completion status."""
    try:
        return await service.toggle_completion(flow_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

## Authentication Middleware

**middleware/auth.py:**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
import asyncio
import logging
import httpx
from src.config import settings

security = HTTPBearer()
logger = logging.getLogger(__name__)

# JWKS cache with TTL, error handling, thread safety, and max stale age
_jwks_cache = {"keys": None, "expires_at": None, "cached_at": None}
_cache_lock: asyncio.Lock | None = None

async def get_logto_jwks() -> dict:
    """
    Fetch and cache Logto JWKS (public keys) with 1-hour TTL.

    Security considerations:
    - Thread-safe with asyncio.Lock to prevent race conditions
    - Lazy lock initialization to avoid RuntimeError at module load
    - TTL of 1 hour allows for JWKS rotation without app restart
    - Falls back to stale cache if fetch fails (avoids auth outage)
    - Max stale age of 2 hours prevents using rotated-out keys indefinitely
    - Validates JWKS structure before caching
    - Network errors are handled gracefully

    Returns:
        dict: JWKS containing public keys

    Raises:
        HTTPException: 503 if fetch fails and no cached keys available or stale cache too old
    """
    global _cache_lock

    # Lazy initialization of lock (avoids RuntimeError: no running event loop)
    if _cache_lock is None:
        _cache_lock = asyncio.Lock()

    now = datetime.now(timezone.utc)

    # Fast path: Return cached JWKS if still valid (no lock needed)
    if _jwks_cache["keys"] and _jwks_cache["expires_at"] and now < _jwks_cache["expires_at"]:
        return _jwks_cache["keys"]

    # Slow path: Acquire lock for cache update
    async with _cache_lock:
        # Double-check after acquiring lock (another request may have updated)
        if _jwks_cache["keys"] and _jwks_cache["expires_at"] and now < _jwks_cache["expires_at"]:
            return _jwks_cache["keys"]

        # Fetch fresh JWKS asynchronously
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{settings.LOGTO_ENDPOINT}/oidc/jwks",
                    timeout=5.0  # 5 second timeout
                )
                response.raise_for_status()
                jwks = response.json()

                # Validate JWKS structure before caching
                if not isinstance(jwks, dict) or "keys" not in jwks or not jwks["keys"]:
                    raise ValueError("Invalid JWKS response: missing 'keys' array")

                # Update cache with 1-hour TTL
                _jwks_cache["keys"] = jwks
                _jwks_cache["expires_at"] = now + timedelta(hours=1)
                _jwks_cache["cached_at"] = now

                return jwks

            except (httpx.HTTPError, httpx.TimeoutException) as e:
                # If fetch fails but we have stale cache, check if it's not too old
                if _jwks_cache["keys"] and _jwks_cache["cached_at"]:
                    stale_age = (now - _jwks_cache["cached_at"]).total_seconds()
                    max_stale = settings.LOGTO_JWKS_MAX_STALE_SECONDS  # Default: 7200 (2 hours)

                    if stale_age < max_stale:
                        logger.warning(
                            "Using stale JWKS cache (age: %.0f seconds) due to fetch error: %s",
                            stale_age, str(e)
                        )
                        return _jwks_cache["keys"]
                    else:
                        logger.error(
                            "Stale JWKS cache too old (age: %.0f seconds, max: %d seconds). Rejecting.",
                            stale_age, max_stale
                        )

                # No cache available or stale cache too old - this is a critical error
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Unable to fetch authentication keys"
                )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate Logto JWT token and extract user_id.

    Returns:
        str: User ID from token sub claim

    Raises:
        HTTPException: 401 if token is invalid or expired
        HTTPException: 503 if JWKS fetch fails and no cache available
    """
    token = credentials.credentials

    try:
        # Fetch JWKS asynchronously (will use cache if valid)
        jwks = await get_logto_jwks()

        # Decode and verify JWT (synchronous operation)
        payload = jwt.decode(
            token,
            key=jwks,
            algorithms=["RS256"],
            audience=settings.LOGTO_APP_ID,
            issuer=f"{settings.LOGTO_ENDPOINT}/oidc",
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iat": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iss": True,
                "require_aud": True,
                "require_iat": True,
                "require_exp": True,
                "require_nbf": False,  # nbf is optional in Logto tokens
            }
        )

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )

        return user_id

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )
```

## Error Handling

**utils/exceptions.py:**
```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom handler for Pydantic validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
```

## Logging Configuration

**middleware/logging.py:**
```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time
import json

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests in structured JSON format."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log request
        logger.info(json.dumps({
            "event": "request_started",
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        }))

        # Process request
        response = await call_next(request)

        # Log response
        duration = time.time() - start_time
        logger.info(json.dumps({
            "event": "request_completed",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2)
        }))

        return response
```

## Deployment Configuration

**Dockerfile:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev --no-root

# Copy application code
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run FastAPI with Uvicorn
CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**pyproject.toml (Poetry):**
```toml
[tool.poetry]
name = "my-flow-api"
version = "1.0.0"
description = "FastAPI backend for My Flow"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.115.0"
uvicorn = {extras = ["standard"], version = "^0.30.0"}
motor = "^3.5.0"
pydantic = "^2.8.0"
pydantic-settings = "^2.4.0"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
httpx = "^0.27.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.3.0"
pytest-asyncio = "^0.24.0"
ruff = "^0.6.0"
mypy = "^1.11.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

---
