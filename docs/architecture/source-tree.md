# Source Tree

This document defines the **canonical directory structure** for the MyFlow project. All development must follow this organization to ensure consistency, maintainability, and team coordination.

---

## Root Directory Structure

```
my-flow/
├── .bmad-core/              # BMAD™ Core agent framework (development automation)
├── .github/                 # GitHub Actions CI/CD workflows
├── .husky/                  # Git hooks (pre-commit, pre-push)
├── docs/                    # All project documentation
├── my_flow_client/          # Next.js 15 frontend application
├── my_flow_api/             # FastAPI backend application
├── scripts/                 # Build and deployment scripts
├── .gitignore              # Git ignore patterns
├── package.json            # Workspace-level package.json (for lint-staged, husky)
└── README.md               # Project overview
```

---

## Frontend Structure (`my_flow_client/`)

The frontend follows **Next.js 15 App Router** conventions with TypeScript strict mode.

### Directory Layout

```
my_flow_client/
├── public/                  # Static assets (images, fonts, favicon)
├── src/
│   ├── app/                 # App Router pages and layouts
│   │   ├── (auth)/          # Auth route group (login, callback)
│   │   │   ├── callback/    # OAuth callback handler
│   │   │   └── login/       # Login page with sign-in component
│   │   ├── api/             # API route handlers
│   │   │   └── logto/       # Logto authentication endpoints
│   │   ├── dashboard/       # Protected dashboard page
│   │   ├── layout.tsx       # Root layout (wraps all pages)
│   │   ├── page.tsx         # Home page (/)
│   │   └── globals.css      # Global styles & CSS variables
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components (Button, Card, etc.)
│   │   └── navigation.tsx   # Site navigation component
│   ├── lib/                 # Utility libraries and helpers
│   │   ├── api-client.ts    # Backend API client (fetch wrapper)
│   │   ├── auth.ts          # Auth utilities (getUser, requireAuth)
│   │   ├── logto.ts         # Logto client configuration
│   │   └── utils.ts         # General utilities (cn, etc.)
│   ├── types/               # TypeScript type definitions
│   │   └── api.ts           # API response types
│   └── test-setup.tsx       # Vitest global test setup
├── e2e/                     # Playwright end-to-end tests
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest test runner configuration
├── playwright.config.ts     # Playwright E2E configuration
└── package.json             # Frontend dependencies
```

### Key Conventions

- **App Router**: File-based routing in `src/app/`
- **Route Groups**: Use `(groupName)/` for logical grouping without affecting URL structure
- **Colocation**: Tests live alongside source files in `__tests__/` directories
- **Component Organization**: UI primitives in `components/ui/`, feature components at root of `components/`
- **Type Safety**: All components and functions must have explicit TypeScript types

---

## Backend Structure (`my_flow_api/`)

The backend follows **Clean Architecture** principles with FastAPI and async Python.

### Directory Layout

```
my_flow_api/
├── src/
│   ├── adapters/            # External service adapters (AI providers, etc.)
│   ├── middleware/          # FastAPI middleware (auth, CORS, logging)
│   │   └── auth.py          # JWT authentication middleware
│   ├── models/              # Pydantic models (domain entities)
│   ├── repositories/        # Data access layer (MongoDB operations)
│   ├── routers/             # FastAPI route handlers (controllers)
│   ├── services/            # Business logic layer
│   ├── config.py            # Configuration (env vars, settings)
│   ├── database.py          # MongoDB connection setup
│   └── main.py              # FastAPI app entry point
├── tests/
│   ├── unit/                # Unit tests (pure functions, services)
│   └── integration/         # Integration tests (DB, API)
├── .python-version          # Python version (3.12+)
├── pyproject.toml           # Poetry/uv dependencies & tool config
├── pytest.ini               # pytest configuration
├── mypy.ini                 # mypy type checker configuration
└── ruff.toml                # Ruff linter & formatter configuration
```

### Layer Responsibilities

| Layer | Directory | Purpose | Dependencies |
|-------|-----------|---------|--------------|
| **Presentation** | `routers/` | HTTP endpoints, request validation | `services/`, `models/` |
| **Business Logic** | `services/` | Core domain logic, orchestration | `repositories/`, `adapters/`, `models/` |
| **Data Access** | `repositories/` | MongoDB CRUD operations | `database.py`, `models/` |
| **External** | `adapters/` | Third-party API integration (OpenAI, Anthropic) | External SDKs |
| **Domain** | `models/` | Pydantic data models (no dependencies) | None |

### Key Conventions

- **Async/Await**: All database and I/O operations must be async
- **Dependency Injection**: Use FastAPI's `Depends()` for service/repo injection
- **Type Hints**: All functions must have complete type annotations
- **Error Handling**: Use custom exception classes, handle in middleware
- **Testing**: Unit tests for services, integration tests for routers + DB

---

## Documentation Structure (`docs/`)

```
docs/
├── architecture/            # Technical architecture (sharded)
│   ├── index.md             # Architecture overview & index
│   ├── tech-stack.md        # Technology selection (this is SSOT)
│   ├── coding-standards.md  # Code style, naming conventions
│   ├── source-tree.md       # This file
│   ├── high-level-architecture.md
│   ├── frontend-architecture.md
│   ├── backend-architecture.md
│   ├── api-specification.md
│   ├── data-models.md
│   ├── components.md
│   ├── 9-unified-project-structure.md
│   ├── 10-development-workflow.md
│   ├── 11-deployment-architecture.md
│   ├── 12-security-and-performance.md
│   ├── 13-testing-strategy.md
│   ├── 15-error-handling-strategy.md
│   ├── 16-monitoring-and-observability.md
│   └── 17-architecture-validation-report.md
├── prd/                     # Product requirements (sharded)
│   └── [epic files]
├── qa/                      # QA reports and test artifacts
│   └── gates/               # Quality gate reports
└── stories/                 # Development stories (tasks for agents)
```

---

## Development & Tooling Structure

### BMAD™ Core Framework (`.bmad-core/`)

```
.bmad-core/
├── agents/                  # Agent persona definitions
├── agent-teams/             # Multi-agent team workflows
├── checklists/              # Quality checklists (DoD, etc.)
├── data/                    # Reference data for agents
├── tasks/                   # Reusable task workflows
├── templates/               # Document templates
├── utils/                   # Utility scripts
├── workflows/               # Complex multi-step workflows
└── core-config.yaml         # Project-wide configuration
```

### GitHub Actions (`.github/workflows/`)

```
.github/workflows/
├── frontend-ci.yml          # Frontend linting, tests, build
├── backend-ci.yml           # Backend linting, type check, tests
└── e2e-tests.yml            # Playwright end-to-end tests
```

### Git Hooks (`.husky/`)

```
.husky/
├── pre-commit               # Runs lint-staged (ESLint, Prettier, Ruff)
└── pre-push                 # Runs tests before push
```

---

## File Naming Conventions

### Frontend (TypeScript/React)

- **Pages**: `page.tsx` (App Router convention)
- **Layouts**: `layout.tsx` (App Router convention)
- **Components**: `kebab-case.tsx` (e.g., `sign-in.tsx`, `navigation.tsx`)
- **UI Components**: `kebab-case.tsx` (e.g., `button.tsx`, `card.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `api-client.ts`, `utils.ts`)
- **Types**: `kebab-case.ts` (e.g., `api.ts`, `user.ts`)
- **Tests**: `__tests__/filename.test.tsx` or `filename.test.tsx` (colocated)
- **Config Files**: `lowercase.config.ts` (e.g., `vitest.config.ts`)

### Backend (Python)

- **Modules**: `snake_case.py` (e.g., `auth.py`, `database.py`)
- **Tests**: `test_*.py` (pytest convention, in `tests/` directory)
- **Config Files**: `lowercase.toml` or `.ini` (e.g., `pyproject.toml`, `pytest.ini`)

### Documentation (Markdown)

- **Architecture Docs**: `kebab-case.md` (e.g., `tech-stack.md`, `api-specification.md`)
- **Stories**: `story-{version}-{short-description}.md` (e.g., `story-1.1-initial-setup.md`)
- **PRD Epics**: `epic-{n}-{name}.md` (e.g., `epic-1-user-authentication.md`)

---

## Import Path Conventions

### Frontend (Next.js)

```typescript
// Absolute imports from src/ (configured in tsconfig.json)
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

// Relative imports for colocated files only
import { SignIn } from './sign-in';
```

### Backend (Python)

```python
# Absolute imports from src/ root
from models.user import User
from repositories.user_repository import UserRepository
from services.auth_service import AuthService

# Relative imports within same package
from .config import settings
```

---

## Testing Directory Conventions

### Frontend Tests

- **Unit Tests**: Colocated in `__tests__/` directories next to source files
- **E2E Tests**: Separate `e2e/` directory at project root
- **Test Utilities**: `src/test-setup.tsx` for global test configuration

### Backend Tests

- **Unit Tests**: `tests/unit/` mirroring `src/` structure
- **Integration Tests**: `tests/integration/` for API + DB tests
- **Fixtures**: `tests/conftest.py` for pytest fixtures
- **Mocks**: `tests/mocks/` for shared test doubles

---

## Build Artifacts (Ignored by Git)

```
# Frontend
my_flow_client/.next/        # Next.js build output
my_flow_client/coverage/     # Vitest coverage reports
my_flow_client/node_modules/ # Dependencies

# Backend
my_flow_api/.venv/           # Virtual environment
my_flow_api/__pycache__/     # Python bytecode
my_flow_api/.pytest_cache/   # pytest cache
my_flow_api/.mypy_cache/     # mypy cache
my_flow_api/htmlcov/         # pytest-cov HTML reports

# Root
node_modules/                # Workspace-level dependencies
.ruff_cache/                 # Ruff linter cache
.uv-cache/                   # uv package manager cache
```

---

## Configuration File Locations

| Tool | Frontend | Backend | Root |
|------|----------|---------|------|
| TypeScript | `tsconfig.json` | - | - |
| ESLint | `.eslintrc.json` | - | - |
| Prettier | `.prettierrc` | - | - |
| Vitest | `vitest.config.ts` | - | - |
| Playwright | `playwright.config.ts` | - | - |
| Python Version | - | `.python-version` | - |
| Poetry/uv | - | `pyproject.toml` | - |
| pytest | - | `pytest.ini` | - |
| mypy | - | `mypy.ini` | - |
| Ruff | - | `ruff.toml` | - |
| Git Hooks | - | - | `.husky/` |
| GitHub Actions | - | - | `.github/workflows/` |

---

## Environment Variables

### Frontend (`.env.local`)

```bash
# Logto Configuration
LOGTO_ENDPOINT=
LOGTO_APP_ID=
LOGTO_APP_SECRET=
LOGTO_COOKIE_SECRET=

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`.env`)

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/myflow

# Logto
LOGTO_ENDPOINT=
LOGTO_APP_ID=
LOGTO_APP_SECRET=

# AI Provider
OPENAI_API_KEY=
# OR
ANTHROPIC_API_KEY=

# Environment
ENVIRONMENT=development
```

**Security Note**: `.env` files are git-ignored. Use 1Password CLI (`op run`) for local development and GitHub Secrets for CI/CD.

---

## Quick Reference: Where Does X Go?

| Type | Location | Example |
|------|----------|---------|
| New page | `my_flow_client/src/app/` | `app/settings/page.tsx` |
| Reusable component | `my_flow_client/src/components/` | `components/flow-card.tsx` |
| UI primitive | `my_flow_client/src/components/ui/` | `components/ui/dialog.tsx` |
| API client function | `my_flow_client/src/lib/api-client.ts` | `createFlow()` |
| Backend endpoint | `my_flow_api/src/routers/` | `routers/flows.py` |
| Business logic | `my_flow_api/src/services/` | `services/flow_service.py` |
| Database query | `my_flow_api/src/repositories/` | `repositories/flow_repository.py` |
| Data model | `my_flow_api/src/models/` | `models/flow.py` |
| External API call | `my_flow_api/src/adapters/` | `adapters/openai_adapter.py` |
| Architecture doc | `docs/architecture/` | `docs/architecture/api-design.md` |
| Story/task | `docs/stories/` | `docs/stories/story-2.1-flows.md` |

---

## Enforcement

This source tree structure is enforced by:

1. **ESLint**: Import path validation (no relative imports outside colocated files)
2. **mypy**: Import resolution (ensures modules exist)
3. **CI/CD**: Build fails if structure violated
4. **Code Review**: Pull requests must follow this structure
5. **BMAD™ Agents**: Dev agents validate structure during story implementation

**Last Updated**: 2025-10-02
**Maintained By**: Architect Agent (Winston)
