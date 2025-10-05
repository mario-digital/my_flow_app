"""FastAPI main application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.database import close_mongo_connection, connect_to_mongo, db_instance
from src.middleware.auth import get_current_user


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan events (startup and shutdown)."""
    # Startup
    await connect_to_mongo()
    print("✅ Connected to MongoDB")

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

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


