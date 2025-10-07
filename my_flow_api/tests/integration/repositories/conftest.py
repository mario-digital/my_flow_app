"""Pytest fixtures for repository integration tests."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.repositories.context_repository import ContextRepository


@pytest.fixture
def mock_collection():
    """Create a mock MongoDB collection with common operations."""
    collection = MagicMock()

    # Set up async mock methods with proper return values
    collection.insert_one = AsyncMock()
    collection.find_one = AsyncMock(return_value=None)  # Default to None
    collection.find_one_and_update = AsyncMock(return_value=None)
    collection.delete_one = AsyncMock()
    collection.delete_many = AsyncMock()

    # Mock find() to return a cursor-like object
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    collection.find = MagicMock(return_value=mock_cursor)

    return collection


@pytest.fixture
def test_db(mock_collection):
    """
    Provide mock test database.

    Mocks MongoDB database for testing repository layer logic.
    """
    mock_db = MagicMock()
    mock_db.__getitem__ = MagicMock(return_value=mock_collection)
    return mock_db


@pytest.fixture
def context_repository(test_db):
    """Provide ContextRepository instance with mock database."""
    return ContextRepository(test_db)


@pytest.fixture
def cleanup_contexts():
    """Placeholder cleanup fixture for consistency."""
    return
