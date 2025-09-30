"""FastAPI main application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings

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
