# MyFlow Backend API

FastAPI backend application for MyFlow - Context-based flow management system.

## Tech Stack

- **Language**: Python 3.12+
- **Framework**: FastAPI 0.115+
- **Database**: MongoDB 7.x+ (Motor async driver)
- **Auth**: Logto (OAuth 2.0, JWT)
- **Package Manager**: uv (fast Python package manager)
- **Testing**: pytest with pytest-asyncio
- **Linting**: Ruff (fast linter + formatter)
- **Type Checking**: mypy

## Setup

### Prerequisites

- Python 3.12 or later
- uv package manager
- MongoDB Atlas account (free tier)
- 1Password CLI (`op`) for secrets

### Installation

```bash
# From root directory
cd my_flow_api

# Install dependencies
uv sync
```

## Available Scripts

### Development
```bash
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing
```bash
uv run pytest                    # Run all tests
uv run pytest --cov=src          # Run with coverage
```

### Code Quality
```bash
uv run ruff check src/           # Lint code
uv run ruff format src/          # Format code
uv run mypy src/                 # Type check
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## Support

Refer to the [root README](../README.md) for overall project documentation.