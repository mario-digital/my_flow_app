"""Health check endpoint for Docker and deployment platforms."""

from typing import Any

import redis.asyncio as redis
from fastapi import APIRouter, status

from src.config import settings
from src.database import get_database

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, Any]:
    """
    Health check endpoint for Docker and deployment platforms.

    Returns:
        dict: Health status including database and cache connectivity
    """
    health_status: dict[str, Any] = {"status": "ok", "db": "unknown", "cache": "unknown"}

    # Check MongoDB connection
    try:
        db = await get_database()
        await db.command("ping")
        health_status["db"] = "connected"
    except Exception:
        health_status["db"] = "disconnected"
        health_status["status"] = "degraded"

    # Check Redis connection (if configured)
    try:
        if settings.REDIS_URL:
            redis_client = redis.from_url(settings.REDIS_URL)  # type: ignore[no-untyped-call]
            try:
                await redis_client.ping()
                health_status["cache"] = "connected"
            finally:
                # Always close the connection to prevent leaks
                await redis_client.aclose()
        else:
            health_status["cache"] = "not_configured"
    except Exception:
        health_status["cache"] = "disconnected"
        health_status["status"] = "degraded"

    return health_status
