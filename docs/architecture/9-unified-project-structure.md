# 9. Unified Project Structure

**Monorepo Organization:**

The project uses **Bun workspaces** to manage both frontend (Next.js) and backend (FastAPI) in a unified repository. This structure facilitates shared tooling, consistent dependency management, and coordinated deployments.

**Root Directory Tree:**

```
my_flow_app/                      # Root monorepo directory
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml       # Next.js CI (lint, typecheck, test, build)
│       ├── backend-ci.yml        # FastAPI CI (ruff, mypy, pytest)
│       └── deploy.yml            # Coordinated deployment workflow
│
├── my_flow_client/               # Next.js 15 frontend (see Frontend Architecture)
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   ├── components/           # React components (Server + Client)
│   │   ├── lib/                  # Utilities, API client, hooks
│   │   └── styles/               # CSS tokens, Tailwind config
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # Tailwind consuming CSS tokens
│   ├── next.config.js            # Next.js configuration
│   └── .env.local                # Frontend environment variables
│
├── my_flow_api/                  # FastAPI backend (see Backend Architecture)
│   ├── src/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── config.py             # Pydantic Settings
│   │   ├── database.py           # MongoDB connection
│   │   ├── models/               # Pydantic schemas
│   │   ├── routers/              # FastAPI routers
│   │   ├── services/             # Business logic layer
│   │   ├── repositories/         # Data access layer
│   │   ├── middleware/           # Auth, logging middleware
│   │   └── adapters/             # External service integrations
│   ├── tests/
│   │   ├── unit/                 # Unit tests
│   │   ├── integration/          # Integration tests
│   │   └── conftest.py           # Pytest fixtures
│   ├── pyproject.toml            # Poetry dependencies
│   ├── poetry.lock               # Locked dependencies
│   ├── Dockerfile                # Production image
│   └── .env                      # Backend environment variables
│
├── packages/                     # (Future) Shared packages
│   └── shared-types/             # Shared TypeScript types (optional)
│       ├── package.json
│       └── src/
│           └── index.ts          # Export shared types/constants
│
├── docs/                         # Project documentation
│   ├── architecture.md           # This document
│   ├── api-spec.md               # OpenAPI specification (reference)
│   └── development-guide.md      # Developer onboarding
│
├── .bmad-core/                   # BMad AI orchestration (if applicable)
│   ├── tasks/                    # Task definitions
│   ├── templates/                # Document templates
│   └── data/                     # Elicitation methods
│
├── .husky/                       # Git hooks (optional)
│   ├── pre-commit                # Run linters before commit
│   └── pre-push                  # Run tests before push
│
├── package.json                  # Root workspace configuration
├── bun.lockb                     # Bun lockfile
├── .gitignore                    # Git ignore patterns
├── README.md                     # Project overview
└── .env.example                  # Environment variable template

```

**Root `package.json` (Bun Workspaces):**

```json
{
  "name": "my-flow-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "my_flow_client",
    "packages/*"
  ],
  "scripts": {
    "dev:frontend": "cd my_flow_client && bun run dev",
    "dev:backend": "cd my_flow_api && poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000",
    "dev": "bun run dev:backend & bun run dev:frontend",
    "build:frontend": "cd my_flow_client && bun run build",
    "build:backend": "cd my_flow_api && docker build -t my-flow-api .",
    "test:frontend": "cd my_flow_client && bun test",
    "test:backend": "cd my_flow_api && poetry run pytest",
    "test": "bun run test:frontend && bun run test:backend",
    "lint:frontend": "cd my_flow_client && bun run lint",
    "lint:backend": "cd my_flow_api && poetry run ruff check src/",
    "lint": "bun run lint:frontend && bun run lint:backend",
    "typecheck:frontend": "cd my_flow_client && bun run typecheck",
    "typecheck:backend": "cd my_flow_api && poetry run mypy src/",
    "typecheck": "bun run typecheck:frontend && bun run typecheck:backend"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

**Environment Variables:**

**.env.example (Root Template):**
```bash
# Frontend (.env.local in my_flow_client/)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LOGTO_ENDPOINT=https://your-logto-instance.logto.app
NEXT_PUBLIC_LOGTO_APP_ID=your-app-id
LOGTO_APP_SECRET=your-app-secret

# Backend (.env in my_flow_api/)
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=myflow
LOGTO_ENDPOINT=https://your-logto-instance.logto.app
LOGTO_APP_ID=your-app-id
CORS_ORIGINS=["http://localhost:3000","https://yourdomain.com"]
```

**CI/CD Workflow Structure:**

**.github/workflows/frontend-ci.yml:**
```yaml
name: Frontend CI

on:
  push:
    paths:
      - 'my_flow_client/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    paths:
      - 'my_flow_client/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd my_flow_client && bun install
      - run: cd my_flow_client && bun run lint
      - run: cd my_flow_client && bun run typecheck
      - run: cd my_flow_client && bun test
      - run: cd my_flow_client && bun run build
```

**.github/workflows/backend-ci.yml:**
```yaml
name: Backend CI

on:
  push:
    paths:
      - 'my_flow_api/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    paths:
      - 'my_flow_api/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install Poetry
        run: pip install poetry
      - name: Install dependencies
        run: cd my_flow_api && poetry install
      - name: Lint
        run: cd my_flow_api && poetry run ruff check src/
      - name: Type check
        run: cd my_flow_api && poetry run mypy src/
      - name: Test
        run: cd my_flow_api && poetry run pytest
```

**Key Structural Decisions:**

1. **Monorepo with Bun Workspaces:** Unified tooling for frontend workspace management; backend remains Python/Poetry-based
2. **Separate CI Pipelines:** Path-based triggers ensure only affected services run CI checks
3. **Coordinated Scripts:** Root `package.json` provides convenience commands for dev, build, test, lint across both services
4. **Shared Packages Prepared:** `packages/shared-types/` can house TypeScript types generated from Pydantic models (future)
5. **Environment Template:** `.env.example` documents all required environment variables for both services
6. **Documentation Co-located:** `docs/` at root provides single source of truth
7. **Git Hooks Optional:** Husky can enforce pre-commit lints/tests if team desires
8. **Docker Backend, Vercel Frontend:** Backend containerized for Railway/any Docker host; frontend optimized for Vercel

**Development Workflow:**

```bash
# Initial setup
git clone <repo>
cd my_flow_app
cp .env.example my_flow_client/.env.local  # Configure frontend env
cp .env.example my_flow_api/.env           # Configure backend env

# Install dependencies
bun install                                # Install frontend + workspace deps
cd my_flow_api && poetry install           # Install backend deps

# Start development servers
bun run dev                                # Starts both frontend (3000) + backend (8000)

# Or individually:
bun run dev:frontend                       # Next.js on :3000
bun run dev:backend                        # FastAPI on :8000

# Run tests/lints
bun run test                               # Run all tests
bun run lint                               # Lint both services
bun run typecheck                          # Type check both services
```

**Design Rationale:**

1. **Why Monorepo?**
   - **Trade-off:** Monorepo adds complexity vs separate repos, but gains coordinated versioning, shared tooling, and easier local development
   - **Decision:** Monorepo chosen because this is a tightly-coupled frontend/backend pair with single product lifecycle
   - **Assumption:** Team is small-to-medium; monorepo scales well up to ~10 services

2. **Why Bun Workspaces (not pnpm/npm)?**
   - **Trade-off:** Bun is newer with smaller ecosystem vs pnpm's maturity
   - **Decision:** Bun chosen for speed and native TypeScript support; aligns with Next.js 15 + Turbopack
   - **Assumption:** Team is comfortable with bleeding-edge tooling

3. **Why Separate CI Workflows (not single workflow)?**
   - **Trade-off:** Separate workflows = more YAML boilerplate vs single workflow with conditional steps
   - **Decision:** Path-based triggers optimize CI time; frontend changes don't trigger backend tests
   - **Questionable:** Could use matrix strategy in single workflow, but separate workflows are more explicit

4. **Why `packages/shared-types/` Future Prep?**
   - **Trade-off:** Adding empty `packages/` directory now vs waiting until needed
   - **Decision:** Structure prepared for future type sharing (e.g., code-generated from Pydantic models)
   - **Assumption:** Type safety across frontend/backend will eventually require shared definitions

5. **Why Poetry for Backend (not requirements.txt)?**
   - **Trade-off:** Poetry adds dependency vs simple requirements.txt
   - **Decision:** Poetry provides deterministic builds, dev/prod separation, and better dependency resolution
   - **Assumption:** Python 3.12+ environment supports modern packaging tools

6. **Why Root Scripts in `package.json`?**
   - **Trade-off:** Developers could `cd` manually vs convenience scripts
   - **Decision:** Convenience scripts reduce cognitive load; `bun run dev` is easier than remembering paths
   - **Questionable:** Could use Makefile or Taskfile instead, but `package.json` scripts are JS ecosystem standard

7. **Why `.env.example` at Root (not per-service)?**
   - **Trade-off:** Single template vs distributed templates
   - **Decision:** Single template provides complete picture; developers copy to appropriate locations
   - **Assumption:** Environment variables won't diverge significantly between environments (dev/staging/prod use same keys)

---
