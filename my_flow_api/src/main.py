"""FastAPI main application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from src.config import settings
from src.database import close_mongo_connection, connect_to_mongo, db_instance
from src.middleware.auth import get_current_user
from src.rate_limit import limiter, rate_limit_exceeded_handler
from src.routers import contexts, conversations, flows, transitions


async def ensure_indexes() -> None:
    """
    Ensure database indexes exist for optimal query performance.

    This function is idempotent - safe to run multiple times.
    MongoDB will skip index creation if it already exists.
    """
    if db_instance.db is None:
        print("⚠️  Database not connected, skipping index creation")
        return

    db = db_instance.db

    # Context collection indexes
    await db.contexts.create_index([("user_id", 1)])
    await db.contexts.create_index([("user_id", 1), ("created_at", -1)])

    # Flow collection indexes
    await db.flows.create_index([("context_id", 1)])
    await db.flows.create_index([("user_id", 1)])
    await db.flows.create_index([("context_id", 1), ("is_completed", 1)])
    await db.flows.create_index([("context_id", 1), ("created_at", -1)])
    await db.flows.create_index([("context_id", 1), ("is_completed", 1), ("priority", 1)])
    await db.flows.create_index(
        [("context_id", 1), ("user_id", 1), ("is_completed", 1), ("created_at", -1)]
    )

    print("✅ Database indexes verified (8 indexes created)")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan events (startup and shutdown)."""
    # Startup
    await connect_to_mongo()
    await ensure_indexes()
    print("✅ Connected to MongoDB with indexes")

    yield

    # Shutdown
    await close_mongo_connection()
    print("✅ Closed MongoDB connection")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for MyFlow - Context-based flow management system",
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Security Middleware Configuration

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# HTTPS enforcement for production (prevents man-in-the-middle attacks)
if settings.ENV == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS configuration with strict validation
# CRITICAL: Never use allow_origins=["*"] in production (security vulnerability)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Explicit origins list from config
    allow_credentials=True,  # Required for JWT cookies/headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

# Register API routers
app.include_router(contexts.router)
app.include_router(conversations.router)
app.include_router(flows.router)
app.include_router(transitions.router)


@app.get(f"{settings.API_V1_STR}/health")
async def health_check() -> dict[str, str | bool]:
    """Health check endpoint with MongoDB connection status."""
    mongodb_connected = False

    try:
        # Ping MongoDB to verify connection
        if db_instance.db is not None:
            await db_instance.db.command("ping")
            mongodb_connected = True
    except Exception as e:
        print(f"MongoDB health check failed: {e}")

    return {
        "status": "healthy" if mongodb_connected else "degraded",
        "mongodb_connected": mongodb_connected,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    docs_url = f"{settings.API_V1_STR}/docs"
    return {"message": f"{settings.PROJECT_NAME} - Navigate to {docs_url} for documentation"}


@app.get(f"{settings.API_V1_STR}/protected", tags=["Auth"])
async def protected_route(user_id: str = Depends(get_current_user)) -> dict[str, str]:
    """Protected endpoint that requires valid JWT authentication."""
    return {
        "message": "This is a protected route",
        "user_id": user_id,
        "timestamp": datetime.now(UTC).isoformat(),
    }
