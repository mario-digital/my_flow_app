"""In-memory cache service with TTL (Time To Live) support."""

import asyncio
import logging
from datetime import UTC, datetime, timedelta

logger = logging.getLogger(__name__)


class CacheService:
    """In-memory cache with TTL (Time To Live) for temporary data storage.

    This service provides a simple caching mechanism for data that doesn't
    need to persist between application restarts. Useful for caching AI-generated
    summaries and other expensive computations.

    Thread-safe using asyncio locks for concurrent access.
    """

    def __init__(self) -> None:
        """Initialize cache with empty storage and lock."""
        self._cache: dict[str, tuple[object, datetime]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> object | None:
        """Get value from cache if not expired.

        Args:
            key: Cache key to retrieve

        Returns:
            Cached value if found and not expired, None otherwise
        """
        async with self._lock:
            if key in self._cache:
                value, expires_at = self._cache[key]
                if datetime.now(UTC) < expires_at:
                    logger.debug("Cache hit for key: %s", key)
                    return value
                # Expired, remove from cache
                logger.debug("Cache expired for key: %s", key)
                del self._cache[key]
        logger.debug("Cache miss for key: %s", key)
        return None

    async def set(self, key: str, value: object, ttl_seconds: int = 300) -> None:
        """Set value in cache with TTL (default 5 minutes).

        Args:
            key: Cache key to store
            value: Value to cache (can be any type)
            ttl_seconds: Time to live in seconds (default 300 = 5 minutes)
        """
        async with self._lock:
            expires_at = datetime.now(UTC) + timedelta(seconds=ttl_seconds)
            self._cache[key] = (value, expires_at)
            logger.debug("Cache set for key: %s (TTL: %d seconds)", key, ttl_seconds)

    async def delete(self, key: str) -> None:
        """Delete key from cache.

        Args:
            key: Cache key to delete
        """
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.debug("Cache deleted for key: %s", key)

    async def clear(self) -> None:
        """Clear all cached data."""
        async with self._lock:
            self._cache.clear()
            logger.info("Cache cleared")


# Global cache instance for context summaries
summary_cache = CacheService()

# Cache for recently dismissed flows to prevent immediate re-creation
dismissed_flow_cache = CacheService()
