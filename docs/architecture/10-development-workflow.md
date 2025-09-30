# 10. Development Workflow

**Local Development Setup:**

This section provides step-by-step instructions for setting up the development environment and common development tasks.

## Prerequisites

**Required Software:**

```bash
# Node.js runtime (via Bun)
curl -fsSL https://bun.sh/install | bash  # Bun v1.1.0+

# Python 3.12+
brew install python@3.12  # macOS
# or
sudo apt install python3.12 python3.12-venv  # Ubuntu/Debian

# Poetry (Python package manager)
curl -sSL https://install.python-poetry.org | python3 -

# MongoDB (local development)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Or use MongoDB Atlas cloud instance (recommended)
# Sign up at https://www.mongodb.com/cloud/atlas

# Docker (optional, for containerized backend development)
# Download from https://www.docker.com/products/docker-desktop

# Git
brew install git  # macOS
# or
sudo apt install git  # Ubuntu/Debian
```

**Verify Installations:**

```bash
bun --version          # Should show v1.1.0+
python3 --version      # Should show Python 3.12+
poetry --version       # Should show Poetry 1.8.0+
mongod --version       # Should show MongoDB 7.0+
git --version          # Should show Git 2.40+
```

## Initial Setup

**Step 1: Clone Repository**

```bash
git clone https://github.com/yourusername/my_flow_app.git
cd my_flow_app
```

**Step 2: Configure Environment Variables**

```bash
# Create frontend environment file
cp .env.example my_flow_client/.env.local

# Create backend environment file
cp .env.example my_flow_api/.env

# Edit environment files with your values
# my_flow_client/.env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_LOGTO_ENDPOINT=https://your-logto-instance.logto.app
#   NEXT_PUBLIC_LOGTO_APP_ID=your-app-id
#   LOGTO_APP_SECRET=your-app-secret

# my_flow_api/.env:
#   MONGODB_URL=mongodb://localhost:27017  # Or Atlas connection string
#   MONGODB_DB_NAME=myflow_dev
#   LOGTO_ENDPOINT=https://your-logto-instance.logto.app
#   LOGTO_APP_ID=your-app-id
#   CORS_ORIGINS=["http://localhost:3000"]
```

**Step 3: Install Dependencies**

```bash
# Install frontend dependencies (Bun workspaces)
bun install

# Install backend dependencies (Poetry)
cd my_flow_api
poetry install
cd ..
```

**Step 4: Initialize Database (if using local MongoDB)**

```bash
# MongoDB will auto-create database on first connection
# Indexes are created automatically via database.py:create_indexes()

# Optional: Seed initial data
cd my_flow_api
poetry run python scripts/seed_db.py  # (Create this script if needed)
cd ..
```

**Step 5: Verify Setup**

```bash
# Run linters to verify configuration
bun run lint              # Should pass
bun run typecheck         # Should pass

# Run tests
bun run test:frontend     # Should pass (or skip if no tests yet)
bun run test:backend      # Should pass (or skip if no tests yet)
```

## Development Commands

**Start All Services (Recommended):**

```bash
# Starts both frontend (:3000) and backend (:8000) concurrently
bun run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs (Swagger UI)
```

**Start Services Individually:**

```bash
# Frontend only (Next.js dev server with Turbopack)
bun run dev:frontend
# → http://localhost:3000

# Backend only (FastAPI with auto-reload)
bun run dev:backend
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

**Build Commands:**

```bash
# Build frontend for production
bun run build:frontend
# Output: my_flow_client/.next/

# Build backend Docker image
bun run build:backend
# Output: Docker image 'my-flow-api:latest'

# Build both
bun run build:frontend && bun run build:backend
```

**Testing Commands:**

```bash
# Run all tests
bun run test

# Frontend tests only (Bun test runner)
bun run test:frontend

# Backend tests only (pytest)
bun run test:backend

# Watch mode (frontend)
cd my_flow_client && bun test --watch

# Watch mode (backend)
cd my_flow_api && poetry run pytest-watch
```

**Linting and Type Checking:**

```bash
# Lint all code
bun run lint

# Lint frontend only (Next.js ESLint)
bun run lint:frontend

# Lint backend only (Ruff)
bun run lint:backend

# Type check all code
bun run typecheck

# Type check frontend only (TypeScript)
bun run typecheck:frontend

# Type check backend only (mypy)
bun run typecheck:backend

# Auto-fix linting issues
cd my_flow_client && bun run lint --fix
cd my_flow_api && poetry run ruff check src/ --fix
```

**Database Operations:**

```bash
# Connect to local MongoDB shell
mongosh myflow_dev

# Export database (backup)
mongodump --db myflow_dev --out ./backups/$(date +%Y%m%d)

# Import database (restore)
mongorestore --db myflow_dev ./backups/20240115/myflow_dev

# Drop database (caution!)
mongosh myflow_dev --eval "db.dropDatabase()"
```

**Clean/Reset Commands:**

```bash
# Remove all node_modules and reinstall
rm -rf node_modules my_flow_client/node_modules
bun install

# Remove backend virtual environment and reinstall
cd my_flow_api
rm -rf .venv
poetry install
cd ..

# Clear Next.js cache
rm -rf my_flow_client/.next

# Clear all caches and reinstall everything
bun run clean  # (Add this script to package.json if needed)
```

## Environment Configuration

**Frontend Environment Variables (`my_flow_client/.env.local`):**

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
# Production: https://api.yourdomain.com

# Logto Authentication (public variables)
NEXT_PUBLIC_LOGTO_ENDPOINT=https://your-instance.logto.app
NEXT_PUBLIC_LOGTO_APP_ID=your-app-id

# Logto Secret (server-side only, not exposed to browser)
LOGTO_APP_SECRET=your-app-secret

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_AI_CHAT=true
```

**Backend Environment Variables (`my_flow_api/.env`):**

```bash
# Database
MONGODB_URL=mongodb://localhost:27017
# Production: mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=myflow_dev
# Production: myflow_prod

# Logto Authentication
LOGTO_ENDPOINT=https://your-instance.logto.app
LOGTO_APP_ID=your-app-id

# CORS Configuration (JSON array)
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
# Production: ["https://yourdomain.com"]

# Optional: External Services
OPENAI_API_KEY=sk-...  # For AI chat features (if implemented)
SENTRY_DSN=https://...  # For error tracking (if implemented)

# Optional: Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Optional: Logging
LOG_LEVEL=INFO
# Development: DEBUG
# Production: WARNING
```

**Environment Variable Security Notes:**

1. **Never commit `.env` or `.env.local` files** - These are in `.gitignore`
2. **Use `.env.example` as template** - Update when adding new variables
3. **Secrets in CI/CD** - Store secrets in GitHub Secrets / Vercel Environment Variables / Railway Environment Variables
4. **Rotation Strategy** - Rotate `LOGTO_APP_SECRET` and database credentials every 90 days
5. **Local vs Production** - Use different Logto apps and MongoDB databases for each environment

## Common Development Scenarios

**Scenario 1: Adding a New Frontend Feature**

```bash
# 1. Create feature branch
git checkout -b feature/add-flow-tags

# 2. Start dev server
bun run dev:frontend

# 3. Create/modify components
# Example: my_flow_client/src/components/flow-tags.tsx

# 4. Test changes
bun run test:frontend

# 5. Type check and lint
bun run typecheck:frontend
bun run lint:frontend

# 6. Commit changes
git add .
git commit -m "feat(flows): add tag support to flows"

# 7. Push and create PR
git push origin feature/add-flow-tags
```

**Scenario 2: Adding a New Backend Endpoint**

```bash
# 1. Create feature branch
git checkout -b feature/add-tags-api

# 2. Start backend dev server
bun run dev:backend

# 3. Add Pydantic model
# Edit: my_flow_api/src/models/tag.py

# 4. Add repository method
# Edit: my_flow_api/src/repositories/tag_repository.py

# 5. Add service logic
# Edit: my_flow_api/src/services/tag_service.py

# 6. Add router endpoint
# Edit: my_flow_api/src/routers/tags.py

# 7. Register router in main.py
# Edit: my_flow_api/src/main.py

# 8. Test endpoint
curl http://localhost:8000/api/v1/tags

# 9. Write tests
# Edit: my_flow_api/tests/unit/test_tag_service.py

# 10. Run tests, lint, type check
cd my_flow_api
poetry run pytest
poetry run ruff check src/
poetry run mypy src/
cd ..

# 11. Commit changes
git add .
git commit -m "feat(api): add tags endpoint"

# 12. Push and create PR
git push origin feature/add-tags-api
```

**Scenario 3: Full-Stack Feature (Frontend + Backend)**

```bash
# 1. Create feature branch
git checkout -b feature/flow-reminders

# 2. Start both servers
bun run dev

# 3. Implement backend first (see Scenario 2 steps)
# 4. Update OpenAPI spec in docs if needed
# 5. Implement frontend (see Scenario 1 steps)

# 6. Test integration
# - Manual: Use frontend UI to test end-to-end
# - API: Test backend endpoint with curl/Postman
# - Frontend: Test with mocked API responses

# 7. Run all tests and checks
bun run test
bun run lint
bun run typecheck

# 8. Commit and push
git add .
git commit -m "feat(reminders): add flow reminder notifications"
git push origin feature/flow-reminders
```

**Scenario 4: Debugging Issues**

```bash
# Frontend debugging
# - Use React DevTools browser extension
# - Check browser console for errors
# - Use Next.js error overlay (dev mode)
# - Add console.log() or debugger statements
# - Check Network tab for API calls

# Backend debugging
# - Check FastAPI logs in terminal
# - Use FastAPI /docs for interactive API testing
# - Add print() or logging.debug() statements
# - Use Python debugger:
cd my_flow_api
poetry run python -m pdb src/main.py

# Database debugging
# - Connect to MongoDB shell
mongosh myflow_dev
db.flows.find({ user_id: "test-user-id" })

# - Check indexes
db.flows.getIndexes()

# Full request tracing
# - Enable request logging middleware (already configured)
# - Check logs for request ID and timing
```

**Scenario 5: Database Schema Changes**

```bash
# MongoDB is schemaless, but you may need to migrate data

# Example: Add new field to existing documents
mongosh myflow_dev
db.flows.updateMany(
  { tags: { $exists: false } },
  { $set: { tags: [] } }
)

# Or create a migration script
cd my_flow_api
poetry run python scripts/migrate_add_tags.py
```

## Design Rationale

1. **Why Bun for Frontend Development?**
   - **Trade-off:** Bun is newer (less mature) vs Node.js/npm stability
   - **Decision:** Bun's speed (3x faster install) and native TypeScript support align with Next.js 15 + Turbopack
   - **Assumption:** Team is comfortable with cutting-edge tooling; Bun's stability is sufficient for development

2. **Why Poetry for Backend Dependencies?**
   - **Trade-off:** Poetry adds dependency vs pip + requirements.txt simplicity
   - **Decision:** Poetry provides deterministic dependency resolution and dev/prod separation
   - **Questionable:** Could use pip-tools or uv for faster installs, but Poetry is more feature-complete

3. **Why Concurrent Dev Servers (bun run dev)?**
   - **Trade-off:** Single command convenience vs separate terminal visibility
   - **Decision:** Single command reduces cognitive load for full-stack development
   - **Assumption:** Developers need to work on both frontend and backend simultaneously most of the time

4. **Why Local MongoDB (not Docker Compose)?**
   - **Trade-off:** Native installation complexity vs Docker simplicity
   - **Decision:** MongoDB is lightweight enough to run natively; reduces Docker overhead
   - **Questionable:** Docker Compose would provide better isolation and easier reset, but adds complexity for beginners

5. **Why Root-Level Scripts (not Makefiles)?**
   - **Trade-off:** package.json scripts (JS ecosystem standard) vs Makefile (cross-language standard)
   - **Decision:** package.json aligns with frontend tooling; Bun can run these scripts efficiently
   - **Assumption:** Team is more familiar with npm scripts than Make

6. **Why Manual Environment Setup (not dotenv automation)?**
   - **Trade-off:** Manual .env.example copying vs automated .env generation
   - **Decision:** Manual setup forces developers to review and understand environment variables
   - **Questionable:** Could use script to auto-populate .env from .env.example with prompts

7. **Why Separate CI Lint/Test Steps (not combined)?**
   - **Trade-off:** Granular feedback vs faster single step
   - **Decision:** Separate steps provide clearer error messages (e.g., "lint failed" vs "tests failed")
   - **Assumption:** CI runtime is less important than developer debugging speed

---
