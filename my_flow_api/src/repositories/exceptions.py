"""
Repository layer exceptions.

This module defines base exception types for repository operations.
Future story implementations (e.g., FlowRepository) may extend these as needed.

Note on error handling strategy:
    Repository methods return None/False for not-found and unauthorized cases
    rather than raising exceptions. This design choice keeps the repository
    layer focused on data access patterns, while the service layer handles
    business logic and translates None/False returns into appropriate HTTP
    responses (404 Not Found, 403 Forbidden, etc.).
"""


class RepositoryError(Exception):
    """
    Base exception for repository layer errors.

    Used for database connection issues, data corruption, and other
    unexpected failures that cannot be resolved at the repository level.
    """
