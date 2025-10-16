# MyFlow - Context-Aware Flow Management System

A production-ready **fullstack monorepo** built with **Next.js 15**, **React 19 Server Components**, **FastAPI**, and **MongoDB**. Features an **intelligent AI conversational agent** for natural language task management with automatic flow extraction, context-aware conversations, and AI-powered task operations.

[![Full Stack CI](https://github.com/mario-digital/my_flow_app/actions/workflows/ci.yml/badge.svg)](https://github.com/mario-digital/my_flow_app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/mario-digital/my_flow_app/actions/workflows/codeql.yml/badge.svg)](https://github.com/mario-digital/my_flow_app/actions/workflows/codeql.yml)
[![Coverage](https://img.shields.io/badge/coverage-80.78%25-brightgreen)](https://github.com/mario-digital/my_flow_app)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![Code style: Ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## Executive Summary

- **AI-Powered Flow Management:** Streaming conversational agent with automatic task extraction and function calling; configurable AI providers.
- **Server-First Architecture:** React 19 Server Components default; Client Components only when necessary (90% bundle reduction).
- **Backend-for-Frontend (BFF):** JWT tokens **never** exposed to browser; Next.js API routes proxy all backend requests.
- **Security by Design:** Logto OAuth 2.0 + JWT validation with JWKS caching; HttpOnly cookies; no tokens in browser.
- **Type Safety:** End-to-end type safety with TypeScript strict mode (frontend) + Python type hints with mypy (backend).
- **Clean Architecture:** Backend follows layered architecture (Routers → Services → Repositories → DB).
- **Design System:** Three-layer CSS token architecture (primitives → semantic → component) enables runtime context theming.
- **Monorepo Efficiency:** Bun workspaces with unified scripts; single `bun run dev` starts both servers.
- **Quality Gates:** 80%+ test coverage enforced; Husky pre-commit hooks (ESLint + Ruff); pytest + Vitest.

---

## Screenshots & Demo

Experience the complete MyFlow journey from onboarding to AI-powered task management:

### Onboarding Experience

<div align="center">
  <img src="my_flow_client/public/screenshots/on_boarding_step_1.png" alt="Welcome Screen" width="600"/>
  <p><em>Step 1: Introduction to Contexts and Flows concept</em></p>
</div>

<div align="center">
  <img src="my_flow_client/public/screenshots/on_boarding_step_2.png" alt="Create First Context" width="600"/>
  <p><em>Step 2: Interactive context creation with icon and color customization</em></p>
</div>

<div align="center">
  <img src="my_flow_client/public/screenshots/on_boarding_step_3.png" alt="Ready to Start" width="600"/>
  <p><em>Step 3: Choose between sample data or start fresh</em></p>
</div>

### Context Management

<div align="center">
  <img src="my_flow_client/public/screenshots/create_new_context.png" alt="My Contexts" width="800"/>
  <p><em>Context overview with progress tracking and create new context modal</em></p>
</div>

<div align="center">
  <img src="my_flow_client/public/screenshots/context_switch.png" alt="Context Switching" width="600"/>
  <p><em>Smart context switching with progress indicators</em></p>
</div>

### AI-Powered Conversation

<div align="center">
  <img src="my_flow_client/public/screenshots/add_flow_froom_chat.png" alt="AI Flow Extraction" width="600"/>
  <p><em>Real-time AI conversation with automatic flow extraction notification</em></p>
</div>

### Main Dashboard

<div align="center">
  <img src="my_flow_client/public/screenshots/dashboard.png" alt="Dashboard" width="900"/>
  <p><em>Complete dashboard: Context switcher, flow list, and AI conversation panel</em></p>
</div>

---

**Key Features Visible:**
- 🎨 Customizable contexts with icons and colors
- 📊 Real-time progress tracking
- 🤖 AI-powered flow extraction from natural language
- 💬 Streaming conversational interface
- ✅ Task completion and priority management
- 🎯 Context-aware organization

---

## AI Agent Features

MyFlow includes an **intelligent AI conversational agent** that makes task management natural and effortless:

### Core AI Capabilities

1. **Streaming Conversations**
   - Real-time chat interface with token-by-token streaming responses
   - Supports OpenAI GPT-4 or Anthropic Claude 3.5 Sonnet
   - Context-aware responses tailored to your current context (Work, Personal, etc.)
   - All conversations automatically saved and retrievable

2. **Automatic Flow Extraction**
   - AI analyzes your natural language conversation
   - Automatically creates actionable tasks (flows) from discussions
   - No manual task creation needed - just chat naturally
   - Example: "I need to finish the presentation and call the client" → Creates 2 flows automatically

3. **AI Tool Use / Function Calling**
   - **Mark Tasks Complete:** "Mark presentation as done" → AI completes the task
   - **Delete Tasks:** "Delete the client call task" → AI removes the task
   - **Update Priority:** "Make the report high priority" → AI adjusts priority
   - Real-time visual feedback for all AI actions

4. **Context Transition Intelligence**
   - Smart warnings when switching contexts with incomplete tasks
   - Suggests urgent tasks in the target context
   - Helps maintain focus and avoid forgetting important items

### Technical Implementation

**Backend (FastAPI)**
- `AIService`: Handles streaming chat and flow extraction
  - Configurable provider (OpenAI or Anthropic)
  - Async streaming with retry logic
  - Structured flow extraction with JSON validation
- `AITools`: Function calling registry
  - Three tools: mark complete, delete, update priority
  - Secure execution with ownership verification
- `TransitionService`: Context switching intelligence
- Server-Sent Events (SSE) for real-time streaming

**Frontend (Next.js)**
- `ChatInterface`: React component with streaming UI
- `useChatStream`: SSE connection hook with reconnection logic
- `useConversationHistory`: Persistent conversation loading
- **BFF Pattern:** `/api/chat/stream` proxy keeps JWT tokens server-side
- Optimistic UI updates with TanStack Query

**Security**
- All AI API keys secured via 1Password CLI
- JWT tokens never exposed to browser
- User-specific flow operations with authorization checks
- Rate limiting on all AI endpoints (20 req/min)

---

## Technical Architecture

### Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 15.x | React Server Components, App Router |
| **React** | React | 19.x | UI library with concurrent features |
| **Language (Frontend)** | TypeScript | 5.6+ | Strict mode, catch errors at compile time |
| **Language (Backend)** | Python | 3.12+ | Type hints, async/await, rich ecosystem |
| **Backend Framework** | FastAPI | 0.115+ | Async Python, auto OpenAPI docs |
| **Database** | MongoDB | 7.x+ | NoSQL document store via Motor driver |
| **Authentication** | Logto | Cloud | OAuth 2.0 + JWT, Next.js + Python SDKs |
| **CSS Framework** | Tailwind CSS | 4.x | Utility-first with design token integration |
| **UI Components** | shadcn/ui | latest | Accessible Radix UI primitives |
| **State (Server)** | TanStack Query | 5.x | Server state caching, optimistic updates |
| **State (Local)** | React Context | native | Minimal global UI state |
| **Package Manager** | Bun | 1.x | 10x faster than npm, native TypeScript |
| **Testing (Frontend)** | Vitest | latest | Fast unit tests, Vite-native |
| **Testing (Backend)** | pytest | latest | Async support, fixtures, parametrize |
| **E2E Testing** | Playwright | latest | Multi-browser, codegen, trace viewer |
| **Linting (Frontend)** | ESLint + Prettier | latest | Next.js config, accessibility rules |
| **Linting (Backend)** | Ruff | latest | 100x faster than Black, auto-fix |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
│  - No JWT tokens (HttpOnly session cookies only)                │
│  - React 19 Server Components (minimal JavaScript)              │
│  - Client Components only for interactivity                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ fetch('/api/flows')
┌────────────────────────▼────────────────────────────────────────┐
│                    NEXT.JS 15 (BFF Proxy)                       │
│  - Server Components: Direct data fetching                      │
│  - API Routes: Proxy to FastAPI with JWT                        │
│  - Server Actions: Form handling, mutations                     │
│  - getApiAccessToken() → JWT (server-side only)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ Authorization: Bearer {JWT}
┌────────────────────────▼────────────────────────────────────────┐
│                  FASTAPI BACKEND (Python)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Routers (HTTP endpoints) → get_current_user(JWT)         │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │ Services (Business logic) → orchestrate operations       │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────────┐   │ 
│  │ Repositories (Data access) → async MongoDB operations    │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │ Adapters (External APIs) → OpenAI/Anthropic (future)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    MONGODB ATLAS                                │
│  - Collections: contexts, flows, user_preferences, conversations│
│  - Indexes: user_id, context_id, compound indexes               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Patterns

### 1. Backend-for-Frontend (BFF) Pattern

**Critical Rule:** Browser **NEVER** calls FastAPI directly. All requests go through Next.js API routes.

**Why?**
- **Security:** JWT tokens never exposed to browser (only HttpOnly session cookies)
- **Simplicity:** No token refresh logic in browser code
- **Flexibility:** Backend URL changes don't affect frontend
- **CORS:** Single-origin requests eliminate CORS complexity

**Example Flow:**
```
Browser → /api/flows → Next.js API Route → FastAPI /api/v1/flows
  ↓           ↓              ↓                    ↓
Session    No JWT       getApiAccessToken()    JWT validated
Cookie                  (server-side)          by middleware
```

**Implementation:**
```typescript
// app/api/flows/route.ts (Next.js BFF proxy)
import { getApiAccessToken } from '@logto/next/server-actions';

export async function GET() {
  // Get JWT token SERVER-SIDE (never exposed to browser)
  const token = await getApiAccessToken();
  
  // Call FastAPI with JWT
  const response = await fetch(`${API_BASE_URL}/api/v1/flows`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  // Return data to browser (no JWT exposed)
  return Response.json(await response.json());
}
```

### 2. React Server Components (RSC) Strategy

**Default to Server Components:**
- All components render on server unless marked `'use client'`
- ~90% reduction in JavaScript bundle size
- Better SEO (fully rendered HTML)
- Faster Time to Interactive (TTI)

**When to use Client Components:**
```typescript
'use client'  // ONLY when component needs:
// 1. Browser APIs (window, localStorage, navigator)
// 2. Event handlers (onClick, onChange, onSubmit)
// 3. React hooks (useState, useEffect, useContext)
// 4. Third-party libraries requiring browser runtime
```

**Example: Server Component with Authentication**
```typescript
// app/dashboard/page.tsx (Server Component - no 'use client')
export default async function DashboardPage() {
  // Server-side authentication check (redirects if not authenticated)
  const claims = await requireAuth();
  
  // Server-side data fetching (no client-side fetch needed)
  const contexts = await apiClient.get('/api/v1/contexts');
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>User ID: {claims?.sub}</p>
      <ContextList initialData={contexts} /> {/* Hybrid: passes initial data */}
    </div>
  );
}
```

### 3. Three-Layer CSS Design Token Architecture

**Purpose:** Enable runtime context theming without JavaScript re-renders.

```css
/* Layer 1: Primitives - Raw values */
:root {
  --primitive-work: #3b82f6;
  --primitive-personal: #f97316;
  --primitive-rest: #a855f7;
  --primitive-social: #10b981;
}

/* Layer 2: Semantic - Purpose-based */
:root {
  --color-context-current: var(--primitive-work);  /* Dynamic */
  --color-bg-primary: var(--primitive-black-900);
  --color-text-primary: var(--primitive-white);
}

/* Layer 3: Component-specific */
:root {
  --button-bg-primary: var(--color-context-current);
  --card-border-active: var(--color-context-current);
}
```

**Dynamic Context Theming (Runtime):**
```typescript
// When user switches context, update CSS custom property
document.documentElement.style.setProperty(
  '--color-context-current', 
  context.color
);
// All components using var(--color-context-current) update instantly
```

**Tailwind Integration:**
```typescript
// tailwind.config.ts - Maps tokens to utility classes
colors: {
  'context': 'var(--color-context-current)',  // Usage: bg-context
  'bg-primary': 'var(--color-bg-primary)',    // Usage: bg-bg-primary
}
```

### 4. Clean Architecture (Backend)

```
Routers (HTTP) → Services (Logic) → Repositories (Data) → MongoDB
     ↓                ↓                    ↓
Pydantic         Business Rules        Async Motor
Validation       Authorization         CRUD Operations
```

**Layer Dependencies:**
- **Routers** depend on: Services, Models
- **Services** depend on: Repositories, Adapters, Models
- **Repositories** depend on: Database, Models
- **Models** depend on: Nothing (pure Pydantic)

---

## Repository Structure

```
my_flow_app/
├── my_flow_client/                      # Next.js 15 frontend (Bun workspace)
│   ├── src/
│   │   ├── app/                        # App Router pages and layouts
│   │   │   ├── (auth)/                 # Auth routes (login, callback)
│   │   │   │   ├── callback/page.tsx   # OAuth callback handler
│   │   │   │   └── login/page.tsx      # Login page
│   │   │   ├── api/                    # BFF proxy API routes
│   │   │   │   ├── flows/route.ts      # Proxy to FastAPI /api/v1/flows
│   │   │   │   └── contexts/route.ts   # Proxy to FastAPI /api/v1/contexts
│   │   │   ├── dashboard/page.tsx      # Protected dashboard (Server Component)
│   │   │   ├── styles/tokens/          # CSS design tokens (3-layer)
│   │   │   │   ├── colors.css
│   │   │   │   ├── typography.css
│   │   │   │   ├── spacing.css
│   │   │   │   ├── effects.css
│   │   │   │   └── animation.css
│   │   │   ├── layout.tsx              # Root layout with Navigation
│   │   │   ├── page.tsx                # Home page
│   │   │   └── globals.css             # Tailwind + token imports
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn/ui primitives (Client)
│   │   │   ├── navigation.tsx          # App navigation (Client)
│   │   │   ├── contexts/               # Context-related components
│   │   │   └── flows/                  # Flow-related components
│   │   ├── lib/
│   │   │   ├── api-client.ts           # Fetch wrapper for BFF routes
│   │   │   ├── auth.ts                 # requireAuth() helper
│   │   │   ├── logto.ts                # Logto client config
│   │   │   └── utils.ts                # General utilities
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── use-contexts.ts         # TanStack Query for contexts
│   │   │   └── use-flows.ts            # TanStack Query for flows
│   │   ├── types/                      # TypeScript types
│   │   │   └── api.ts                  # API request/response types
│   │   └── test-setup.tsx              # Vitest global setup
│   ├── e2e/                            # Playwright E2E tests
│   ├── eslint.config.mjs               # ESLint configuration
│   ├── next.config.ts                  # Next.js configuration
│   ├── tailwind.config.ts              # Tailwind CSS configuration
│   ├── vitest.config.ts                # Vitest test runner
│   └── package.json
│
├── my_flow_api/                         # FastAPI backend (Python uv project)
│   ├── src/
│   │   ├── main.py                     # FastAPI app + lifespan events
│   │   ├── config.py                   # Pydantic Settings (env vars)
│   │   ├── database.py                 # MongoDB connection (Motor)
│   │   ├── rate_limit.py               # Rate limiting (slowapi)
│   │   ├── middleware/
│   │   │   └── auth.py                 # JWT validation + JWKS cache
│   │   ├── models/                     # Pydantic schemas
│   │   │   ├── context.py              # Context request/response models
│   │   │   ├── flow.py                 # Flow models with status enum
│   │   │   └── preferences.py          # UserPreferences models
│   │   ├── routers/                    # API endpoints (controllers)
│   │   │   ├── contexts.py             # Context CRUD
│   │   │   ├── flows.py                # Flow CRUD + completion
│   │   │   ├── preferences.py          # User preferences
│   │   │   ├── conversations.py        # AI chat (future)
│   │   │   └── transitions.py          # Context transitions (future)
│   │   ├── services/                   # Business logic layer
│   │   │   ├── context_service.py
│   │   │   ├── flow_service.py         # Status computation logic
│   │   │   └── preferences_service.py
│   │   ├── repositories/               # Data access layer
│   │   │   ├── base.py                 # BaseRepository with common CRUD
│   │   │   ├── context_repository.py
│   │   │   ├── flow_repository.py      # MongoDB queries + indexes
│   │   │   └── preferences_repository.py
│   │   └── adapters/                   # External integrations
│   │       └── ai_provider.py          # OpenAI/Anthropic (future)
│   ├── tests/
│   │   ├── unit/                       # Unit tests (services, models)
│   │   ├── integration/                # Integration tests (API + DB)
│   │   └── conftest.py                 # Pytest fixtures
│   ├── pyproject.toml                  # uv dependencies + Ruff config
│   ├── pytest.ini                      # Pytest configuration
│   ├── mypy.ini                        # mypy type checker config
│   └── README.md
│
├── docs/                                # Comprehensive documentation
│   ├── architecture/                   # Technical architecture (sharded v4)
│   │   ├── index.md
│   │   ├── tech-stack.md               # SSOT for all technology decisions
│   │   ├── high-level-architecture.md
│   │   ├── frontend-architecture.md
│   │   ├── backend-architecture.md
│   │   ├── api-specification.md        # OpenAPI 3.1 spec
│   │   ├── data-models.md              # MongoDB schema + indexes
│   │   ├── coding-standards.md
│   │   ├── source-tree.md              # File organization rules
│   │   ├── testing-strategy.md         # 70/20/10 pyramid
│   │   └── [14 more architecture docs]
│   ├── prd/                            # Product requirements (sharded v4)
│   │   ├── index.md
│   │   ├── goals-and-background-context.md
│   │   ├── requirements.md
│   │   ├── epic-1-foundation-authentication-project-setup.md
│   │   ├── epic-2-context-flow-data-layer-with-ui-foundation.md
│   │   └── [3 more epics]
│   ├── stories/                        # User stories (1.1 - 4.6)
│   │   ├── 1.1.story.md                # Story: Next.js 15 + FastAPI Setup
│   │   ├── 1.2.story.md                # Story: MongoDB Integration
│   │   └── [26 more stories]
│   └── qa/                             # QA artifacts
│       └── gates/                      # Quality gate reports (YAML)
│
├── .bmad-core/                          # BMAD agent framework
│   ├── agents/                         # Agent persona definitions
│   ├── tasks/                          # Reusable task workflows
│   ├── templates/                      # Document templates
│   ├── checklists/                     # Quality checklists
│   └── core-config.yaml                # Project-wide configuration
│
├── scripts/                             # Cross-cutting utilities
│   ├── run_backend_tests.sh
│   ├── load-secrets.sh                 # 1Password integration
│   └── setup-1password.sh
│
├── .github/workflows/                   # CI/CD (future)
├── .husky/                              # Git hooks (pre-commit, pre-push)
├── .env.template                        # Environment variable template
├── package.json                         # Workspace root config
└── README.md                            # This file
```

---

## Authentication & Security

### JWT Validation Flow

```python
# src/middleware/auth.py (FastAPI)
async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Validate Logto JWT and extract user_id."""
    token = credentials.credentials
    
    # 1. Fetch JWKS (cached for 1 hour, thread-safe)
    jwks = get_logto_jwks(request_id)
    
    # 2. Verify JWT signature, expiration, issuer
    payload = jwt.decode(
        token,
        key=signing_key,
        algorithms=["RS256", "ES256", "ES384"],
        audience=settings.LOGTO_APP_ID,
        issuer=f"{settings.LOGTO_ENDPOINT}/oidc"
    )
    
    # 3. Extract user_id from 'sub' claim
    user_id = payload.get("sub")
    return user_id  # Used for authorization in routes
```

### Security Features

- **JWKS Caching:** Public key cache with 1-hour TTL, automatic key rotation support
- **Thread-Safe:** `RLock` prevents race conditions in multi-worker deployments
- **Per-Request Tracking:** Request IDs for observability and debugging
- **HttpOnly Cookies:** Session cookies never accessible via JavaScript
- **HTTPS Enforcement:** Production middleware redirects HTTP → HTTPS
- **CORS Whitelist:** Explicit allowed origins (no wildcard `*`)
- **Rate Limiting:** slowapi middleware (100 req/min standard, 20 req/min AI endpoints)

---

## Testing Strategy (70/20/10 Pyramid)

```
         E2E Tests (~10%)
        /              \
   Integration Tests (~20%)
  /                        \
Frontend Unit (~35%)    Backend Unit (~35%)
```

### Coverage Requirements

- **Frontend:** 80% line coverage (components, hooks, utilities)
- **Backend:** 80% line coverage (services, repositories, routers)
- **E2E:** Critical user flows (login, CRUD operations, error handling)

### Test Commands

```bash
# Frontend tests (Vitest)
cd my_flow_client
bun test                    # Run unit tests
bun run test:watch          # Watch mode
bun run test:coverage       # With coverage report

# Backend tests (pytest)
cd my_flow_api
uv run pytest               # Run all tests
uv run pytest --cov=src     # With coverage
uv run pytest -v            # Verbose output

# E2E tests (Playwright)
cd my_flow_client
bun run test:e2e            # Run E2E tests
bun run test:e2e:ui         # Interactive UI mode

# All tests (monorepo)
bun run test                # Runs frontend + backend tests
```

### Test Organization

**Frontend:**
- **Unit Tests:** Colocated with source files (`component.test.tsx`)
- **Integration Tests:** `my_flow_client/__tests__/integration/`
- **E2E Tests:** `my_flow_client/e2e/`

**Backend:**
- **Unit Tests:** `my_flow_api/tests/unit/` (services, models)
- **Integration Tests:** `my_flow_api/tests/integration/` (API + DB)

---

## Installation & Setup

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Purpose | Install Link |
|------|---------|---------|--------------|
| **Bun** | 1.x+ | Package manager & runtime | [Install Bun](https://bun.sh/) |
| **Python** | 3.12+ | Backend runtime | [Install Python](https://www.python.org/) |
| **uv** | latest | Fast Python package manager | [Install uv](https://docs.astral.sh/uv/) |
| **1Password CLI** | latest | Secure secret management | [Install op](https://developer.1password.com/docs/cli/) |
| **MongoDB** | 7.x+ | Database (Atlas free tier) | [Sign up](https://www.mongodb.com/cloud/atlas) |

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd my_flow_app

# 2. Install all dependencies
bun install                      # Frontend dependencies
cd my_flow_api && uv sync && cd ..  # Backend dependencies

# 3. Configure secrets (1Password)
op signin                        # Authenticate with 1Password
./scripts/setup-1password.sh     # Create vault and secrets

# 4. Start development servers
op run --env-file=.env.template -- bun run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

### Environment Configuration

All secrets are managed via **1Password CLI**. See `.env.template` for required variables:

**Frontend** (`.env.template` → 1Password):
```bash
NEXT_PUBLIC_API_URL="op://MyFlow Development/MyFlow Backend/api_url"
NEXT_PUBLIC_LOGTO_ENDPOINT="op://MyFlow Development/MyFlow Logto Frontend/endpoint"
NEXT_PUBLIC_LOGTO_APP_ID="op://MyFlow Development/MyFlow Logto Frontend/app_id"
LOGTO_APP_SECRET="op://MyFlow Development/MyFlow Logto Frontend/app_secret"
LOGTO_COOKIE_SECRET="op://MyFlow Development/MyFlow Logto Frontend/cookie_secret"
```

**Backend** (`.env.template` → 1Password):
```bash
MONGODB_URI="op://MyFlow Development/MyFlow MongoDB/uri"
LOGTO_ENDPOINT="op://MyFlow Development/MyFlow Logto Backend/endpoint"
LOGTO_APP_ID="op://MyFlow Development/MyFlow Logto Backend/app_id"
LOGTO_APP_SECRET="op://MyFlow Development/MyFlow Logto Backend/app_secret"
OPENAI_API_KEY="op://MyFlow Development/MyFlow AI Keys/openai_api_key"
ANTHROPIC_API_KEY="op://MyFlow Development/MyFlow AI Keys/anthropic_api_key"
AI_PROVIDER=openai  # or "anthropic"
AI_MODEL=gpt-4  # or "claude-3-5-sonnet-20241022"
```

---

## Development Workflow

### Available Scripts

```bash
# Development
bun run dev              # Run both frontend (3000) and backend (8000)
bun run dev:frontend     # Run frontend only
bun run dev:backend      # Run backend only

# Testing
bun run test             # Run all tests (frontend + backend)
bun run test:frontend    # Run frontend tests (Vitest)
bun run test:backend     # Run backend tests (pytest)

# Quality Gates
bun run lint             # Lint all code (ESLint + Ruff)
bun run format           # Format all code (Prettier + Ruff)
bun run typecheck        # Type check all code (tsc + mypy)

# Building
bun run build            # Build both projects
bun run build:frontend   # Build frontend for production
bun run build:backend    # Build backend Docker image (future)
```

### Git Hooks (Husky + lint-staged)

**Pre-commit:**
```bash
# .husky/pre-commit
lint-staged
```

**Lint-staged configuration:**
```json
{
  "my_flow_client/**/*.{ts,tsx,mjs}": [
    "eslint --fix",
    "prettier --write"
  ],
  "my_flow_api/src/**/*.py": [
    "ruff format",
    "ruff check --fix"
  ]
}
```

### Development Tips

1. **Hot Reload:** Both servers support hot reload (Next.js Turbopack + uvicorn `--reload`)
2. **API Documentation:** Visit `http://localhost:8000/api/v1/docs` for interactive Swagger UI
3. **Debug Logs:** Backend uses structured JSON logging to stdout
4. **Type Generation:** Frontend types can be generated from OpenAPI spec (future: `openapi-typescript`)

---

## API Documentation

### Interactive Docs (Development)

When the backend is running, comprehensive API documentation is available:

- **Swagger UI:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc:** [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
- **OpenAPI JSON:** [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

### API Endpoints Overview

| Resource | Endpoint | Methods | Purpose |
|----------|----------|---------|---------|
| **Health** | `/health` | GET | Service health + DB connection status |
| **Contexts** | `/api/v1/contexts` | GET, POST | List and create contexts |
| **Contexts** | `/api/v1/contexts/{id}` | GET, PATCH, DELETE | Manage single context |
| **Flows** | `/api/v1/contexts/{id}/flows` | GET, POST | List and create flows in context |
| **Flows** | `/api/v1/flows/{id}` | GET, PATCH, DELETE | Manage single flow |
| **Flows** | `/api/v1/flows/{id}/complete` | POST | Toggle flow completion |
| **Flows** | `/api/v1/flows/due` | GET | Get flows with upcoming due dates |
| **Preferences** | `/api/v1/preferences` | GET, PATCH | Get and update user preferences |
| **Conversations** | `/api/v1/conversations` | GET | Get conversation history for context |
| **Conversations** | `/api/v1/conversations/stream` | POST | AI chat streaming + flow extraction |
| **Transitions** | `/api/v1/transitions/suggestions` | GET | Context switching intelligence |
| **Transitions** | `/api/v1/transitions/warnings/{id}` | GET | Incomplete flow warnings |

### Authentication

All endpoints (except `/health`) require authentication via **Logto JWT tokens**.

**Header Required (from Next.js BFF only):**
```
Authorization: Bearer <logto_jwt_token>
```

**Browser-side requests:**
```typescript
// ❌ WRONG: Browser calling FastAPI directly
const response = await fetch('http://localhost:8000/api/v1/flows', {
  headers: { Authorization: `Bearer ${token}` } // Token exposed!
});

// ✅ CORRECT: Browser calls Next.js proxy
const response = await fetch('/api/flows'); // Next.js route
```

---

## Deployment

### Current Status: Local Development

**Note:** CI/CD pipelines and deployment workflows are documented but not yet implemented. Production deployment will be configured in **Story 2.1: Production Deployment & CI/CD Completion**.

### Planned Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL (Frontend)                       │
│  - Next.js 15 static + server rendering                         │
│  - Global CDN with automatic region selection                   │
│  - Environment variables via Vercel dashboard                   │
│  - Automatic preview deployments for PRs                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────────┐
│                      RAILWAY (Backend)                          │
│  - FastAPI container with auto-scaling                          │
│  - Health check monitoring                                      │
│  - Environment variables via Railway UI                         │
│  - Automatic deploys on push to main                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ TLS
┌────────────────────────▼────────────────────────────────────────┐
│                    MONGODB ATLAS (Database)                     │
│  - M0 free tier (512MB) or M2 shared cluster                    │
│  - Same region as Railway backend (low latency)                 │
│  - Automatic backups + point-in-time recovery                   │
└─────────────────────────────────────────────────────────────────┘
```

### Build Commands

```bash
# Frontend (Next.js)
cd my_flow_client
bun run build                # Production build with Turbopack
bun run start                # Start production server

# Backend (FastAPI)
cd my_flow_api
docker build -t myflow-api .  # Build Docker image (future)
uvicorn src.main:app --host 0.0.0.0 --port 8000  # Production server
```

---

## Performance & Optimization

### Frontend Optimizations

- **Server Components Default:** ~90% reduction in JavaScript bundle size
- **Dynamic Imports:** Charts and heavy components loaded on-demand
- **Image Optimization:** Next.js `Image` component with automatic WebP conversion
- **Prefetching:** Next.js automatically prefetches links on hover
- **Tailwind JIT:** Only CSS for used utilities included in bundle
- **Design Tokens:** CSS custom properties enable runtime theming without React re-renders

### Backend Optimizations

- **MongoDB Indexes:** 9 indexes created on startup for optimal query performance
- **Async Operations:** All DB operations use async/await with Motor driver
- **Connection Pooling:** MongoDB client maintains connection pool
- **JWKS Caching:** Public keys cached for 1 hour (reduces Logto API calls)
- **Rate Limiting:** slowapi middleware prevents abuse

### Performance Budgets (Target)

| Metric | Target | Purpose |
|--------|--------|---------|
| **Largest Contentful Paint (LCP)** | < 2.5s | Core Web Vital |
| **First Input Delay (FID)** | < 100ms | Core Web Vital |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Core Web Vital |
| **Time to Interactive (TTI)** | < 3.8s | User experience |
| **API Response Time (p95)** | < 500ms | Backend performance |

---

## Data Models & Database Schema

### MongoDB Collections

**1. Contexts** - User life domains (Work, Personal, Rest, Social)
```typescript
{
  _id: ObjectId,
  user_id: string,       // Logto user ID from JWT
  name: string,          // "Work", "Personal", etc.
  color: string,         // Hex color: "#3B82F6"
  icon: string,          // Emoji: "💼"
  created_at: DateTime,
  updated_at: DateTime
}
```

**2. Flows** - Actionable tasks within contexts
```typescript
{
  _id: ObjectId,
  context_id: ObjectId,  // Parent context reference
  user_id: string,       // For authorization
  title: string,         // Task description
  description?: string,  // Optional details
  priority: "low" | "medium" | "high",
  is_completed: boolean,
  due_date?: DateTime,   // Optional deadline
  reminder_enabled: boolean,
  created_at: DateTime,
  updated_at: DateTime,
  completed_at?: DateTime
}
```

**3. UserPreferences** - App settings per user
```typescript
{
  _id: ObjectId,
  user_id: string,       // Unique index
  default_context_id?: ObjectId,
  notification_preferences: {
    email_reminders: boolean,
    browser_notifications: boolean,
    reminder_lead_time: number  // Minutes
  },
  ui_preferences: {
    flow_list_view: "compact" | "detailed",
    context_sort_order: "recent" | "alphabetical" | "custom"
  },
  created_at: DateTime,
  updated_at: DateTime
}
```

**4. Conversations** - AI chat history (future)
```typescript
{
  _id: ObjectId,
  context_id: ObjectId,
  user_id: string,
  messages: Array<{
    id: string,
    role: "user" | "assistant" | "system",
    content: string,
    timestamp: DateTime,
    metadata?: {
      flow_ids?: string[],
      tokens_used?: number
    }
  }>,
  created_at: DateTime,
  updated_at: DateTime
}
```

### MongoDB Indexes

**Contexts Collection:**
- `user_id` (fast user lookup)
- `(user_id, created_at desc)` (sorted listing)

**Flows Collection:**
- `context_id` (flows within context)
- `user_id` (user-level queries)
- `(context_id, is_completed, priority)` (filtered queries)
- `(context_id, due_date, is_completed)` (due date queries)
- `(user_id, due_date, is_completed)` (cross-context reminders)

**UserPreferences Collection:**
- `user_id` (unique, one preferences doc per user)

**Conversations Collection:**
- `user_id`, `context_id`, `(user_id, context_id)`, `(context_id, updated_at desc)`

---

## Design System & Theming

### CSS Design Token Files

```
src/app/styles/tokens/
├── colors.css        # 3-layer color system (primitives → semantic → component)
├── typography.css    # Font families, sizes, weights, line heights
├── spacing.css       # Spacing scale (4px base unit)
├── effects.css       # Shadows, borders, radius, z-index
└── animation.css     # Transition durations and easings
```

### Color Token Layers

**Layer 1: Primitives** (Raw values, never change at runtime)
```css
--primitive-work: #3b82f6;
--primitive-personal: #f97316;
--primitive-rest: #a855f7;
--primitive-social: #10b981;
```

**Layer 2: Semantic** (Purpose-based, maps to primitives)
```css
--color-context-current: var(--primitive-work);  /* Dynamic */
--color-bg-primary: var(--primitive-black-900);
--color-text-primary: var(--primitive-white);
```

**Layer 3: Component-specific** (Maps to semantic tokens)
```css
--button-bg-primary: var(--color-context-current);
--card-border-active: var(--color-context-current);
```

### Runtime Theming

```typescript
// When user switches context
document.documentElement.style.setProperty(
  '--color-context-current',
  newContext.color
);
// All components using var(--color-context-current) update instantly
// No React re-renders needed
```

---

## Contributing

### Workflow

1. **Create Feature Branch:** Branch from `main` (e.g., `feature/add-flow-filtering`)
2. **Follow Standards:** See `docs/architecture/coding-standards.md`
3. **Write Tests:** 80%+ coverage required
4. **Run Quality Gates:**
   ```bash
   bun run lint        # ESLint + Ruff
   bun run format      # Prettier + Ruff
   bun run typecheck   # tsc + mypy
   bun run test        # Vitest + pytest
   ```
5. **Submit PR:** Ensure all checks pass before requesting review

### Code Style

**Frontend (TypeScript):**
- ESLint: Next.js recommended config + accessibility rules
- Prettier: 2-space indentation, single quotes, trailing commas
- TypeScript: Strict mode enabled

**Backend (Python):**
- Ruff: 100-character line length, isort integration
- mypy: Strict type checking enforced
- Type hints: Required for all functions

---

## CI/CD & Quality Automation

**Status:** ✅ **Production-ready quality gates and automation**

### 🔒 Local Quality Gates (Git Hooks)

**Pre-Commit Hook** - Runs on every commit:
- ✨ `lint-staged` - Auto-formats changed files
- 🧹 ESLint (frontend) + Ruff (backend) - Lints only changed files
- 📝 TypeScript + mypy type checking
- ⚡ Smart detection - Only checks relevant code (frontend/backend)

**Pre-Push Hook** - Runs before push:
- 🧪 Full test suite with coverage (80%+ required)
- 🏗️ Production build verification
- 🔒 Secret detection (prevents committing `.env` files)
- 🔍 Full linting and type checking
- ⚡ Only runs checks for changed code paths

### 🤖 GitHub Actions Workflows

**Full Stack CI** (`.github/workflows/ci.yml`)
- Triggers: Every push and PR to `main`
- Backend job: Ruff → mypy → pytest with coverage
- Frontend job: ESLint → tsc → Vitest with coverage → build
- Parallel execution for speed
- Dependency caching (2-3x faster)
- Coverage uploaded to Codecov
- Status check that fails if any job fails

**CodeQL Security Scanning** (`.github/workflows/codeql.yml`)
- Triggers: Every push, PR, and weekly (Mondays)
- Analyzes JavaScript/TypeScript and Python code
- Detects security vulnerabilities automatically
- Reports to GitHub Security tab
- Industry-standard security analysis

**Auto-Labeling** (`.github/workflows/auto-label.yml`)
- Triggers: Every PR opened/updated
- Automatically adds labels based on changed files:
  - `frontend`, `backend`, `documentation`, `tests`
  - `ci`, `dependencies`, `configuration`
- Makes PR organization effortless

**Dependabot** (`.github/dependabot.yml`)
- Schedule: Weekly (Mondays)
- Monitors frontend (npm), backend (pip), and GitHub Actions
- Creates PRs for dependency updates
- Max 10 PRs per ecosystem
- Auto-assigns reviewers
- Keeps dependencies secure and up-to-date

### 📊 Coverage & Quality Metrics

- **Frontend:** 80%+ line coverage (enforced)
- **Backend:** 80%+ line coverage (enforced)
- **E2E:** Critical user flows covered
- **Codecov:** Real-time coverage tracking
- **CodeQL:** Continuous security monitoring

### ✅ What's Fully Automated

- ✅ Code formatting (Prettier + Ruff)
- ✅ Linting (ESLint + Ruff)
- ✅ Type checking (TypeScript + mypy)
- ✅ Unit tests (Vitest + pytest)
- ✅ Integration tests (both frontend and backend)
- ✅ Build verification (Next.js production builds)
- ✅ Security scanning (CodeQL)
- ✅ Dependency updates (Dependabot)
- ✅ PR labeling (auto-labeler)
- ✅ Coverage tracking (Codecov)

### ⏳ Planned for Future Epics

- 🔄 Frontend deployment to Vercel (automatic preview + production)
- 🔄 Backend deployment to Railway (container + auto-scaling)
- 🔄 MongoDB Atlas production integration
- 🔄 E2E tests in CI (Playwright on GitHub Actions)
- 🔄 Performance monitoring (Lighthouse CI)

### 🎯 Quality Gate Requirements

**For any code to be merged to `main`:**

1. ✅ All pre-commit checks pass (local)
2. ✅ All pre-push checks pass (local)
3. ✅ GitHub Actions CI passes (all jobs green)
4. ✅ No CodeQL security alerts introduced
5. ✅ Test coverage ≥ 80%
6. ✅ No TypeScript/mypy type errors
7. ✅ No linting errors
8. ✅ Production build succeeds

**Recommended (can be enforced via branch protection):**
- ✅ At least 1 code review approval
- ✅ Branch is up-to-date with `main`

### 🔗 Quick Links

- **CI Dashboard:** `https://github.com/YOUR_USERNAME/my_flow_app/actions`
- **Security Alerts:** `https://github.com/YOUR_USERNAME/my_flow_app/security`
- **Coverage Reports:** `https://codecov.io/gh/YOUR_USERNAME/my_flow_app`
- **Dependabot PRs:** Check Pull Requests with `dependencies` label

---

**Note:** This CI/CD setup represents enterprise-grade automation, ensuring nothing broken reaches production.

---

## Development Methodology

> This project was built using **BMAD-METHOD** (an AI-agent framework for structured development). Architecture, data contracts, and security patterns were designed manually; AI tools assisted with boilerplate generation, test scaffolding, and documentation.

**Workflow:**
PRD → Architecture → Component-driven development → Testing → Performance tuning → Documentation

**BMAD Agents Used:**
- **Architect (Winston):** System design, technology selection, architecture documentation
- **Product Manager (John):** PRD creation, epic breakdown, story prioritization
- **Scrum Master (Bob):** Story drafting with technical context for dev agents
- **Developer (James):** Story implementation following layered architecture
- **QA (Quinn):** Test architecture, quality gates, NFR validation

---

## Browser Support

- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+
- **Mobile:** Modern iOS Safari (14+) and Chrome Android (90+)

---

## License

[License TBD]

---

## Acknowledgments

Built with Next.js 15, React 19, FastAPI, MongoDB, TypeScript, and AI-powered conversations. Authentication powered by Logto. Secret management via 1Password CLI.

---

## Support & Documentation

For detailed information, refer to:
- **Architecture:** [`docs/architecture/`](docs/architecture/)
- **Product Requirements:** [`docs/prd/`](docs/prd/)
- **User Stories:** [`docs/stories/`](docs/stories/)
- **API Specification:** [`docs/architecture/api-specification.md`](docs/architecture/api-specification.md)
- **Tech Stack (SSOT):** [`docs/architecture/tech-stack.md`](docs/architecture/tech-stack.md)