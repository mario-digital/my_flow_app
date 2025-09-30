"""Application entry point for running the FastAPI server."""

from collections.abc import Mapping

import uvicorn

from src.main import app

__all__ = ["app", "main"]


def main(extra_uvicorn_kwargs: Mapping[str, object] | None = None) -> None:
    """Run the FastAPI application using uvicorn."""
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        **(extra_uvicorn_kwargs or {}),
    )


if __name__ == "__main__":
    main()
