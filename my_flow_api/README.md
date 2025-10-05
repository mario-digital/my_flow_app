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

### MongoDB Atlas Setup

1. **Create Free Tier Cluster**:
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create M0 (free tier) cluster - 512MB storage
   - Choose region closest to your hosting platform

2. **Configure Database User**:
   - Go to Security → Database Access
   - Add New Database User with password authentication
   - Grant "Atlas Admin" role (for development)
   - Save username and password

3. **Configure Network Access**:
   - Go to Security → Network Access
   - Add IP Address → Allow Access From Anywhere (0.0.0.0/0)
   - ⚠️ For development only - restrict in production

4. **Get Connection String**:
   - Go to Deployment → Database → Connect
   - Choose "Connect your application"
   - Select Driver: Python 3.12+
   - Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/myflow`

5. **Store in 1Password**:
   - Create item in `my_flow_secrets` vault named `myflow_mongodb`
   - Add field `MONGODB_URI` with full connection string
   - Add field `MONGODB_DB_NAME` with database name (e.g., `myflow`)

### Environment Variables

Required environment variables (stored in `.env.template` with 1Password references):

```bash
# MongoDB Configuration
MONGODB_URI=op://my_flow_secrets/myflow_mongodb/MONGODB_URI
MONGODB_DB_NAME=op://my_flow_secrets/myflow_mongodb/MONGODB_DB_NAME

# Application Configuration
ENV=development
PROJECT_NAME=MyFlow API
VERSION=0.1.0

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000"]

# Logto Authentication (from Story 1.2)
LOGTO_ENDPOINT=op://my_flow_secrets/logto/LOGTO_ENDPOINT
LOGTO_APP_ID=op://my_flow_secrets/logto/LOGTO_APP_ID
LOGTO_APP_SECRET=op://my_flow_secrets/logto/LOGTO_APP_SECRET
```

## Available Scripts

### Development
```bash
# With 1Password secret injection (recommended)
./dev.sh

# Or manually:
op run --env-file=../.env.template -- uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
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

## Database Index Strategy

The application creates the following MongoDB indexes on startup for optimal performance:

### Contexts Collection
- `user_id` - Single field index for user-based queries
- `user_id + created_at` - Compound index for sorting contexts by creation date

### Flows Collection
- `context_id` - Single field index for context-based queries
- `user_id` - Single field index for user-based queries
- `context_id + is_completed + priority` - Compound index for filtering and sorting flows
- `context_id + due_date + is_completed` - Compound index for due date queries
- `user_id + due_date + is_completed` - Compound index for user's due flows

### User Preferences Collection
- `user_id` (unique) - Unique index ensuring one-to-one relationship with users

**Rationale**: These indexes support common query patterns while minimizing write overhead. Indexes are created automatically during application startup.

## Troubleshooting

### Common Issues

**Issue**: `ServerSelectionTimeoutError` on connection
- **Cause**: IP not whitelisted in MongoDB Atlas
- **Fix**: Add current IP to Atlas Network Access or use 0.0.0.0/0 for development

**Issue**: "Authentication failed" error
- **Cause**: Wrong username/password in connection string
- **Fix**: Verify credentials in 1Password match Atlas database user

**Issue**: Connection string format incorrect
- **Cause**: Missing `+srv` or wrong protocol
- **Fix**: Use format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

**Issue**: Database not created
- **Cause**: MongoDB creates database on first write, not on connection
- **Fix**: Normal behavior - database will appear after first document insert

**Issue**: 1Password secret injection fails
- **Cause**: Not authenticated with 1Password CLI
- **Fix**: Run `op signin` to authenticate

### Verifying Setup

Test MongoDB connection:
```bash
# Start the server with 1Password
op run --env-file=.env.template -- uv run uvicorn src.main:app --reload

# Check startup logs for:
✅ Connected to MongoDB

# Test health endpoint:
curl http://localhost:8000/api/v1/health

# Should return:
{
  "status": "healthy",
  "mongodb_connected": true,
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

## Support

Refer to the [root README](../README.md) for overall project documentation.