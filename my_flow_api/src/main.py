"""FastAPI main application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MyFlow API",
    description="Backend API for MyFlow - Context-based flow management system",
    version="0.1.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

# CORS configuration (will be loaded from settings in later stories)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "my-flow-api", "version": "0.1.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "MyFlow API - Navigate to /api/v1/docs for documentation"}