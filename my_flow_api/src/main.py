"""FastAPI main application entry point."""

from datetime import UTC, datetime

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.middleware.auth import get_current_user

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for MyFlow - Context-based flow management system",
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
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
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "service": "my-flow-api", "version": settings.VERSION}


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
