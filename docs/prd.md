# My Flow Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable users to seamlessly switch between different life contexts (work, personal, rest, social) without losing track of open tasks and conversations
- Provide AI-powered assistance to extract actionable flows from natural conversation
- Reduce cognitive load during context switching by preserving flow state
- Create a single source of truth for context-specific tasks, conversations, and progress
- Support rapid context transitions with minimal friction

### Background Context

My Flow addresses the modern challenge of frequent context switching across multiple life domains. Research shows that context switching imposes significant cognitive costs, yet remains unavoidable in daily life. Current productivity tools treat each context in isolation, forcing users to manually recreate their mental state when switching between work projects, personal tasks, family responsibilities, and leisure activities.

This application leverages conversational AI to make context switching natural and effortless. Instead of forcing users to manually organize tasks into rigid structures, My Flow allows users to simply talk through what they need to do, automatically extracting actionable "flows" (task sequences) and maintaining continuity across context switches. The MVP focuses on core context management, AI-powered flow extraction, and intelligent transition support.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-30 | 1.0 | Initial PRD created from Project Brief | PM Agent |

---

## Requirements

### Functional

- FR1: Users can create, edit, and delete named contexts (e.g., "Work", "Personal", "Fitness", "Family")
- FR2: Each context has a distinct visual identity (color, icon) for quick recognition
- FR3: Users can switch between contexts with a single interaction (dropdown or shortcut)
- FR4: Within each context, users can converse with an AI assistant about their tasks and plans
- FR5: The AI assistant extracts actionable "flows" (task sequences) from conversation and displays them as structured items
- FR6: Users can view all flows associated with the current context
- FR7: Users can manually mark flows as complete or delete them
- FR8: Users can edit flow details (title, description, priority) after AI extraction
- FR9: The system preserves conversation history and flow state when switching between contexts
- FR10: Users can view a summary of their current context including active flows and recent conversation highlights
- FR11: The AI provides contextual suggestions when transitioning between contexts (e.g., "You have 3 incomplete flows in your Work context")
- FR12: Users authenticate via a secure third-party identity provider (Logto)
- FR13: All user data (contexts, flows, conversations) is private and isolated per user account
- FR14: The system supports real-time AI streaming responses for natural conversation flow
- FR15: Users can archive completed contexts and flows for historical reference
- FR16: The system provides a dashboard view showing all contexts with flow counts and completion status
- FR17: Users can search across all contexts and flows using keywords

### Non Functional

- NFR1: The application must support real-time AI streaming with response latency under 2 seconds
- NFR2: Context switching operations must complete in under 500ms to maintain flow
- NFR3: The system must handle at least 100 concurrent users without performance degradation
- NFR4: All user data must be encrypted at rest and in transit
- NFR5: The application must achieve 99% uptime during MVP evaluation period
- NFR6: The frontend must be responsive and work on desktop browsers (Chrome, Firefox, Safari, Edge)
- NFR7: The application must use MongoDB free tier (512MB storage limit) efficiently
- NFR8: API response times must be under 200ms for CRUD operations (excluding AI inference)
- NFR9: The application must be deployable to Vercel (frontend) and Railway/Render (backend) free tiers
- NFR10: All backend code must have at least 80% test coverage
- NFR11: All frontend code must have at least 70% test coverage
- NFR12: The application must implement proper error handling and user-friendly error messages
- NFR13: The system must support graceful degradation if AI services are temporarily unavailable
- NFR14: All code must follow TypeScript strict mode (frontend) and Python type hints with mypy (backend)
- NFR15: The application must meet WCAG AA accessibility standards for keyboard navigation and screen readers

---

## User Interface Design Goals

### Overall UX Vision

My Flow delivers a calm, focused interface that minimizes cognitive load during context switching. The design emphasizes clarity, speed, and visual distinction between contexts through thoughtful use of color and iconography. Dark mode creates a distraction-free environment suitable for extended use. The interface should feel conversational and natural, encouraging users to interact with the AI as they would with a colleague or assistant.

### Key Interaction Paradigms

- **Context-First Navigation:** The context switcher is always visible and accessible, allowing instant transitions without losing place
- **Conversational Interface:** The AI chat is the primary interaction method, with traditional CRUD forms as secondary alternatives
- **Progressive Disclosure:** Flow details expand inline rather than navigating to separate pages
- **Optimistic Updates:** UI reflects actions immediately while background operations complete, with graceful error rollback

### Core Screens and Views

- Login Screen
- Main Dashboard (context overview with flow counts)
- Context Chat View (AI conversation + flow list for current context)
- Flow Management Panel (list view with quick actions)
- Settings Page (context management, preferences)

### Accessibility: WCAG AA

All interactive elements must be keyboard navigable, screen reader compatible, and provide clear focus indicators. Color is not the sole means of conveying information (use icons and text labels as well).

### Branding

- **Dark Mode Only:** No light mode variant. Background uses deep blacks/grays for reduced eye strain
- **CSS Design Tokens:** All colors, spacing, typography, and visual properties are defined as CSS custom properties (CSS variables) from day one
- **Context-Specific Accent Colors:** Each context type has a distinct accent color (work=blue, personal=orange, rest=purple, social=green)

**Example CSS Design Tokens:**
```css
/* Color tokens */
--color-bg-primary: #0a0a0a;
--color-bg-secondary: #1a1a1a;
--color-bg-tertiary: #2a2a1a;
--color-text-primary: #e8e8e8;
--color-text-secondary: #a8a8a8;
--color-accent-work: #4a9eff;
--color-accent-personal: #ff9d5c;
--color-accent-rest: #9d7aff;
--color-accent-social: #6bcc85;

/* Spacing tokens */
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;

/* Typography tokens */
--font-family-base: 'Inter', system-ui, sans-serif;
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.25rem;
--font-size-xl: 1.5rem;

/* Radius and shadow tokens */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px rgba(0,0,0,0.4);
```

### Target Device and Platforms: Web Responsive

Desktop-first responsive design (1920x1080 primary, 1440x900 secondary). Mobile support is secondary for MVP but interface should degrade gracefully.

---

## Technical Assumptions

### Repository Structure: Monorepo

The project uses a monorepo structure with `/my_flow_api` (FastAPI backend) and `/my_flow_client` (Next.js frontend) as separate packages within a single Git repository. This enables shared tooling, coordinated versioning, and simplified deployment workflows.

### Service Architecture

**Monolithic FastAPI backend** with modular internal structure (routers, services, repositories). The backend is deployed as a single service but organized internally for maintainability and testability. Frontend is a **Next.js 15 App Router** application deployed separately to Vercel.

**Rationale:** Microservices add unnecessary complexity for MVP scale. A well-structured monolith with clear module boundaries provides faster development velocity while maintaining code quality.

### Testing Requirements

**Backend:**
- Unit tests with pytest for models, repositories, services
- Integration tests for API endpoints using TestClient
- Target: 80%+ code coverage
- Fast test suite (under 30 seconds for full run)

**Frontend:**
- Unit tests with Vitest + React Testing Library for components and hooks
- Integration tests with Playwright for critical user flows (login, context switching, flow creation)
- Target: 70%+ code coverage
- Storybook for component development and visual testing

**Rationale:** High backend coverage ensures data integrity and API reliability. Frontend testing focuses on critical paths while allowing faster iteration on UI details.

### Additional Technical Assumptions and Requests

**Frontend Stack:**
- **Framework:** Next.js 15.x (App Router, React 19.x, TypeScript 5.x strict mode)
- **Component Library:** shadcn/ui (Radix UI primitives + customizable components)
- **Styling:** Tailwind CSS 4.x configured with CSS custom properties (design tokens)
- **Package Manager:** Bun 1.x for fast installs and runtime
- **State Management:** TanStack Query v5 for server state, React Context for local UI state
- **Testing:** Vitest + React Testing Library (unit), Playwright (E2E)
- **Authentication:** Logto Next.js SDK

**Example Tailwind Config (CSS Tokens Integration):**
```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // Enable dark mode (always active)
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        context: {
          work: 'var(--color-accent-work)',
          personal: 'var(--color-accent-personal)',
          rest: 'var(--color-accent-rest)',
          social: 'var(--color-accent-social)',
        },
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
      },
    },
  },
}
```

**Backend Stack:**
- **Framework:** FastAPI 0.115.x+ (Python 3.12+)
- **Type Safety:** Pydantic v2.x for all models, mypy strict mode for type checking
- **Database:** MongoDB 7.x+ (Motor 3.x async driver)
- **Dependency Management:** Poetry or uv
- **Testing:** pytest + pytest-asyncio + pytest-cov
- **Authentication:** Logto Python SDK for JWT validation
- **AI Integration:** OpenAI GPT-4 or Anthropic Claude 3.5 (SDK clients with streaming support)

**Infrastructure:**
- **Database:** MongoDB Atlas free tier (512MB)
- **Secret Management:** 1Password CLI (`op`) for all environment variables and secrets (local and CI/CD)
- **Frontend Hosting:** Vercel (free tier)
- **Backend Hosting:** Railway, Render, or Fly.io (free tier)
- **Local Development:** Docker Compose with 1Password secret injection (`op run -- docker-compose up`)
- **CI/CD:** GitHub Actions with 1Password service accounts for secret injection

**Parallel Development Enablers:**
- OpenAPI schema auto-generated from FastAPI for frontend type generation
- Shared TypeScript types generated from Pydantic models (using openapi-typescript or similar)
- MSW (Mock Service Worker) for frontend API mocking during development
- API contract documentation maintained in PRD Epic sections

**Rationale:** shadcn/ui + Tailwind provides a complete design system with full customization via CSS tokens. TypeScript strict mode across both frontend and backend ensures type safety. 1Password CLI eliminates `.env` files and secrets in repos, improving security. Monorepo structure with parallel-friendly epics enables frontend and backend teams to work simultaneously after Epic 1 foundation is established.

---

## Epic List

### Epic 1: Foundation, Authentication & Project Setup
**Goal:** Establish project infrastructure, authentication, and deployment pipeline. Deliver a fully functional "Hello World" deployment with authentication flow and health checks. **(Serial: 2-3 days)**

### Epic 2: Context & Flow Data Layer with UI Foundation
**Goal:** Build core data models (Context, Flow) in backend and foundational UI components (Context Switcher, Flow List). Enable users to create contexts and manually add flows. **(Parallel Work: Backend stories 2.1-2.4, Frontend stories 2.5-2.8)**

**API Contract:**
```
GET    /api/contexts              → List all contexts
GET    /api/contexts/{id}/flows   → List flows for context
POST   /api/flows                 → Create flow
PUT    /api/flows/{id}            → Update flow
DELETE /api/flows/{id}            → Delete flow
PATCH  /api/flows/{id}/complete   → Mark flow complete
```

### Epic 3: AI Conversational Interface & Flow Extraction
**Goal:** Implement AI chat interface with streaming responses and automatic flow extraction from conversation. Users can converse naturally and see flows appear automatically. **(Parallel Work: Backend AI service 3.1-3.4, Frontend chat UI 3.5-3.8)**

**API Contract:**
```
POST   /api/chat/stream           → WebSocket or SSE for AI streaming
POST   /api/chat/extract-flows    → Extract flows from conversation
GET    /api/conversations/{id}    → Get conversation history
```

### Epic 4: Transition Intelligence & Contextual Mock Data
**Goal:** Add smart context transition features (summaries, suggestions, incomplete flow warnings). Populate app with realistic mock data for demo purposes. **(Parallel Work: Backend transition logic 4.1-4.3, Frontend transition UI 4.4-4.6, Mock data 4.7)**

**API Contract:**
```
GET    /api/contexts/{id}/summary           → Context summary
GET    /api/transitions/suggestions         → Transition suggestions
POST   /api/mock-data/generate              → Generate mock data
```

### Epic 5: Comprehensive Testing, Performance Optimization & Production Deployment
**Goal:** Achieve full test coverage, optimize performance (caching, query optimization, bundle size), and deploy to production with monitoring. **(Parallel Work: Backend testing/perf 5.1-5.4, Frontend testing/perf 5.5-5.8, Deployment 5.9-5.10)**

---

## Epic 1: Foundation, Authentication & Project Setup

**Epic Goal:** Establish the foundational infrastructure for both frontend and backend, implement authentication via Logto, configure CI/CD pipelines, and achieve a fully deployable "Hello World" system with health checks and environment variable management via 1Password CLI. This epic is intentionally serial to establish the foundation before parallel work begins in Epic 2.

---

### Story 1.1: Project Structure, Git Setup & 1Password CLI Integration

**As a** developer,
**I want** a complete project structure with Git, environment templates, and 1Password CLI secret management,
**so that** both frontend and backend teams can work securely without committing secrets to version control.

#### Acceptance Criteria

1. Monorepo structure created with `/my_flow_api` and `/my_flow_client` directories
2. Git repository initialized with proper `.gitignore` (excludes `.env`, `.env.*`, `node_modules/`, `__pycache__/`, etc.)
3. README.md files created for root, `/my_flow_api`, and `/my_flow_client` with setup instructions
4. Backend dependencies initialized: `poetry init` or `uv init` with FastAPI, Pydantic, Motor, pytest, mypy
5. Frontend dependencies initialized: `bun create next-app` with TypeScript, Tailwind CSS, shadcn/ui CLI configured
6. **1Password CLI installed and configured for all environments:**
   - 1Password vault created with name "MyFlow Development"
   - Items created for: Logto (backend), Logto (frontend), MongoDB connection, OpenAI/Anthropic API keys
   - Template files created: `.env.template` (documents required variables without actual secrets)
7. **1Password CLI (`op`) configured for secret management:**
   - 1Password vault created: "MyFlow Development" with items for each environment
   - Template files created: `.env.template` (documents required variables, no actual secrets)
   - Scripts created: `scripts/load-secrets.sh`
   - Example: `op run --env-file=.env.template -- bun dev` to run with injected secrets
8. Both projects run locally with 1Password secret injection: `op run -- bun dev` (frontend on :3000), `op run -- uvicorn main:app --reload` (backend on :8000)

---

### Story 1.2: Logto Authentication Setup (Backend)

**As a** backend developer,
**I want** Logto JWT authentication configured in FastAPI,
**so that** all API endpoints can validate user identity and protect resources.

#### Acceptance Criteria

1. Logto application created in Logto cloud console (type: Traditional Web App for backend API)
2. **Logto credentials stored in 1Password vault:**
   - Item name: "MyFlow Logto Backend"
   - Fields: `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_RESOURCE` (API identifier)
3. FastAPI middleware created in `my_flow_api/app/middleware/auth.py` to validate Logto JWTs
4. Dependency injection function `get_current_user()` extracts `user_id` from JWT claims
5. Protected route example created: `GET /api/v1/protected` returns user info (requires valid JWT)
6. Unprotected route example: `GET /api/v1/health` (no auth required)
7. Unit tests verify middleware rejects invalid tokens (401) and accepts valid tokens
8. **Run backend with 1Password:** `op run -- uvicorn main:app --reload` successfully authenticates requests with Logto tokens

---

### Story 1.3: Logto Authentication Setup (Frontend)

**As a** frontend developer,
**I want** Logto authentication configured in Next.js,
**so that** users can sign in and the app can make authenticated API requests.

#### Acceptance Criteria

1. Logto application created in Logto cloud console (type: Single Page App for Next.js)
2. **Logto credentials stored in 1Password vault:**
   - Item name: "MyFlow Logto Frontend"
   - Fields: `NEXT_PUBLIC_LOGTO_ENDPOINT`, `NEXT_PUBLIC_LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_COOKIE_SECRET` (for session encryption)
3. Logto Next.js SDK installed (`@logto/next`) and configured in `app/api/logto/[...logto]/route.ts`
4. Login page created at `/login` with Logto sign-in button
5. Protected page created at `/dashboard` (redirects to `/login` if not authenticated)
6. Navigation component shows "Sign In" (logged out) or "Sign Out" (logged in)
7. Access token retrieval function created to attach JWT to API requests
8. **Run frontend with 1Password:** `op run -- bun dev` successfully authenticates users via Logto

---

### Story 1.4: MongoDB Atlas Setup & Connection

**As a** backend developer,
**I want** MongoDB Atlas free tier configured and connected to FastAPI,
**so that** the application can persist user data securely.

#### Acceptance Criteria

1. MongoDB Atlas free tier cluster created (512MB storage, M0 tier)
2. Database user created with read/write permissions (username/password auth)
3. IP whitelist configured to allow connections from development and hosting environments (or 0.0.0.0/0 for MVP)
4. **MongoDB connection string stored in 1Password vault:**
   - Item name: "MyFlow MongoDB"
   - Field: `MONGODB_URI` (connection string with credentials)
5. Motor async client configured in `my_flow_api/app/database/connection.py`
6. Database connection established on FastAPI startup, closed on shutdown
7. Health check endpoint `GET /api/v1/health` includes MongoDB connection status
8. **Run backend with 1Password:** `op run -- uvicorn main:app --reload` successfully connects to MongoDB

---

### Story 1.5: CI/CD Pipeline with GitHub Actions

**As a** developer,
**I want** automated CI/CD pipelines for testing and deployment,
**so that** code quality is maintained and deployments are reliable.

#### Acceptance Criteria

1. GitHub Actions workflow created: `.github/workflows/backend-ci.yml`
   - Triggers on pull requests and pushes to `main` branch
   - Runs: linting (ruff), type checking (mypy), unit tests (pytest), coverage report
2. GitHub Actions workflow created: `.github/workflows/frontend-ci.yml`
   - Triggers on pull requests and pushes to `main` branch
   - Runs: linting (eslint), type checking (tsc), unit tests (vitest), build verification
3. **GitHub Actions uses 1Password service account for secrets:**
   - 1Password service account token stored in GitHub Secrets: `OP_SERVICE_ACCOUNT_TOKEN`
   - Workflows use `op run` command to inject secrets during CI runs
   - Example: `op run --env-file=.env.template -- pytest`
4. CI workflows fail if tests fail or coverage drops below thresholds (80% backend, 70% frontend)
5. Status badges added to root README.md showing CI status
6. Deployment workflow created: `.github/workflows/deploy.yml` (triggered on successful merge to `main`)
   - Deploys frontend to Vercel
   - Deploys backend to Railway/Render/Fly.io

---

### Story 1.6: Vercel Deployment Configuration (Frontend)

**As a** frontend developer,
**I want** the Next.js app deployed to Vercel with environment variables,
**so that** the production app is accessible and authenticated.

#### Acceptance Criteria

1. Vercel project created and linked to GitHub repository
2. **Vercel environment variables configured via 1Password integration:**
   - Vercel supports 1Password integration or manual entry of secrets
   - Production environment variables: `NEXT_PUBLIC_LOGTO_ENDPOINT`, `NEXT_PUBLIC_LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_COOKIE_SECRET`
   - Environment variables sourced from 1Password vault (manual copy or integration)
3. Build configuration set to `/my_flow_client` directory
4. Production deployment successful at `https://<project>.vercel.app`
5. Login flow works in production (redirects to Logto, returns to app after auth)
6. **GitHub Actions deploy workflow uses 1Password to push secrets to Vercel:**
   - Workflow injects secrets via 1Password service account
   - Uses Vercel CLI to set environment variables: `vercel env add`

---

### Story 1.7: Railway/Render/Fly.io Deployment Configuration (Backend)

**As a** backend developer,
**I want** the FastAPI app deployed to Railway/Render/Fly.io with environment variables,
**so that** the production API is accessible and secure.

#### Acceptance Criteria

1. Railway/Render/Fly.io project created and linked to GitHub repository (or deployed via CLI)
2. **Environment variables configured via platform (sourced from 1Password):**
   - `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `MONGODB_URI`, `OPENAI_API_KEY` (or Anthropic)
   - Secrets copied from 1Password vault to hosting platform environment settings
3. Build configuration set to `/my_flow_api` directory, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Production deployment successful at `https://<project>.railway.app` (or Render/Fly.io equivalent)
5. Health check endpoint `GET /api/v1/health` returns 200 with MongoDB connection status
6. **GitHub Actions deploy workflow uses 1Password to push secrets to hosting platform:**
   - Workflow injects secrets via 1Password service account
   - Uses platform CLI to set environment variables

---

### Story 1.8: Docker Compose for Local Development

**As a** developer,
**I want** Docker Compose configured for local development with all services,
**so that** the entire stack runs consistently across machines without manual setup.

#### Acceptance Criteria

1. `docker-compose.yml` created at project root with services: `mongodb`, `backend`, `frontend`
2. MongoDB service uses official `mongo:7` image with persistent volume
3. Backend service builds from `/my_flow_api/Dockerfile`, exposes port 8000
4. Frontend service builds from `/my_flow_client/Dockerfile`, exposes port 3000
5. **Docker Compose uses 1Password CLI for secret injection:**
   - Docker Compose configured to use `op run -- docker-compose up` for secret injection
   - Services reference environment variables that are populated from 1Password at runtime
   - Alternative: 1Password Connect Server configured as Docker service for secret injection (optional, simpler is `op run`)
   - Documentation shows both approaches: `op run -- docker-compose up` (recommended) vs 1Password Connect
7. Health checks configured for all services
8. Port mappings: MongoDB (27017), Backend (8000), Frontend (3000)
9. Services start in correct order (MongoDB → Backend → Frontend)
10. Documentation in README with `op run -- docker-compose up` command and troubleshooting tips

---

## Epic 2: Context & Flow Data Layer with UI Foundation

**Epic Goal:** Build the core data models and CRUD operations for contexts and flows in the backend, along with foundational UI components for context switching and flow management. This epic establishes the data layer that enables users to create, view, and organize their contexts and flows, providing the essential foundation for AI-powered flow extraction in Epic 3.

**API Contract:**
```
GET    /api/contexts              → List all contexts
GET    /api/contexts/{id}/flows   → List flows for context
POST   /api/flows                 → Create flow
PUT    /api/flows/{id}            → Update flow
DELETE /api/flows/{id}            → Delete flow
PATCH  /api/flows/{id}/complete   → Mark flow complete
```

**Parallel Work Sections:**
- **Backend (Stories 2.1-2.4):** Pydantic models, MongoDB repositories, CRUD APIs
- **Frontend (Stories 2.5-2.8):** shadcn/ui components, Context Switcher, Flow List, TanStack Query integration

---

### Story 2.1: Context & Flow Pydantic Models with MongoDB Schemas

**As a** backend developer,
**I want** fully typed Pydantic models for Context and Flow entities with MongoDB schema definitions,
**so that** we have strict type safety and validation for all data operations.

#### Acceptance Criteria

1. **Pydantic models created in `my_flow_api/app/models/context.py`:**
   - `ContextBase`, `ContextCreate`, `ContextUpdate`, `ContextInDB`, `ContextResponse`
   - Fields: `id` (ObjectId), `user_id` (str), `name` (str, 1-50 chars), `color` (hex color), `icon` (str), `created_at` (datetime), `updated_at` (datetime)
   - Validators for color hex format and icon emoji
   - Config: `from_attributes = True`, `json_encoders` for ObjectId and datetime

2. **Pydantic models created in `my_flow_api/app/models/flow.py`:**
   - `FlowBase`, `FlowCreate`, `FlowUpdate`, `FlowInDB`, `FlowResponse`
   - Fields: `id` (ObjectId), `context_id` (ObjectId), `title` (str, 1-200 chars), `description` (Optional[str]), `is_completed` (bool), `priority` (Literal["low", "medium", "high"]), `created_at`, `updated_at`, `completed_at` (Optional[datetime])
   - Validators for title length and priority enum

3. **MongoDB indexes defined:**
   - Contexts collection: Index on `user_id`, compound index on `(user_id, created_at desc)`
   - Flows collection: Index on `context_id`, compound index on `(context_id, is_completed, priority)`

4. **Type exports created in `my_flow_api/app/models/__init__.py`:**
   - All models properly exported for internal use

5. **Unit tests created in `my_flow_api/tests/test_models/test_context.py` and `test_flow.py`:**
   - Validation tests for all fields (boundaries, invalid formats)
   - Serialization/deserialization tests
   - At least 90% coverage for model files

---

### Story 2.2: Context Repository with CRUD Operations

**As a** backend developer,
**I want** a repository pattern implementation for Context CRUD operations,
**so that** we have a clean separation between data access and business logic.

#### Acceptance Criteria

1. **Repository class created in `my_flow_api/app/repositories/context_repository.py`:**
   - `ContextRepository(motor_client: AsyncIOMotorClient)`
   - Methods: `create()`, `get_by_id()`, `get_all_by_user()`, `update()`, `delete()`
   - All methods async with proper error handling
   - Uses Motor async MongoDB driver

2. **Repository methods return typed Pydantic models:**
   - `create(user_id: str, context_data: ContextCreate) -> ContextInDB`
   - `get_by_id(context_id: str, user_id: str) -> Optional[ContextInDB]`
   - `get_all_by_user(user_id: str) -> List[ContextInDB]`
   - `update(context_id: str, user_id: str, updates: ContextUpdate) -> Optional[ContextInDB]`
   - `delete(context_id: str, user_id: str) -> bool`

3. **Error handling includes:**
   - `DocumentNotFoundError` for missing documents
   - `UnauthorizedAccessError` for user_id mismatches
   - MongoDB connection errors properly propagated

4. **Integration tests created in `my_flow_api/tests/test_repositories/test_context_repository.py`:**
   - Uses MongoDB test database (not production)
   - Tests all CRUD operations with real async MongoDB calls
   - Tests error conditions (not found, unauthorized)
   - Cleans up test data after each test
   - At least 85% coverage

---

### Story 2.3: Flow Repository with CRUD Operations

**As a** backend developer,
**I want** a repository pattern implementation for Flow CRUD operations,
**so that** flows can be managed with proper validation and context association.

#### Acceptance Criteria

1. **Repository class created in `my_flow_api/app/repositories/flow_repository.py`:**
   - `FlowRepository(motor_client: AsyncIOMotorClient)`
   - Methods: `create()`, `get_by_id()`, `get_all_by_context()`, `update()`, `delete()`, `mark_complete()`
   - All methods async with proper error handling

2. **Repository methods return typed Pydantic models:**
   - `create(context_id: str, flow_data: FlowCreate) -> FlowInDB`
   - `get_by_id(flow_id: str) -> Optional[FlowInDB]`
   - `get_all_by_context(context_id: str, include_completed: bool = False) -> List[FlowInDB]`
   - `update(flow_id: str, updates: FlowUpdate) -> Optional[FlowInDB]`
   - `delete(flow_id: str) -> bool`
   - `mark_complete(flow_id: str) -> Optional[FlowInDB]`

3. **Validation includes:**
   - Context existence validation before flow creation
   - User authorization (verify user owns the context before flow operations)
   - Completed flows cannot be marked complete again

4. **Integration tests created in `my_flow_api/tests/test_repositories/test_flow_repository.py`:**
   - Tests all CRUD operations with real async MongoDB calls
   - Tests `mark_complete()` sets `completed_at` timestamp
   - Tests filtering by `include_completed` parameter
   - Tests error conditions (invalid context_id, not found, etc.)
   - At least 85% coverage

---

### Story 2.4: Context & Flow REST API Endpoints

**As a** backend developer,
**I want** FastAPI REST endpoints for context and flow management,
**so that** the frontend can perform all CRUD operations via HTTP.

#### Acceptance Criteria

1. **Context API routes created in `my_flow_api/app/api/v1/contexts.py`:**
   - `GET /api/v1/contexts` → List user's contexts (requires auth)
   - `POST /api/v1/contexts` → Create context (requires auth, validates body)
   - `GET /api/v1/contexts/{id}` → Get single context (requires auth + ownership)
   - `PUT /api/v1/contexts/{id}` → Update context (requires auth + ownership)
   - `DELETE /api/v1/contexts/{id}` → Delete context (requires auth + ownership, cascades to flows)
   - All routes use dependency injection for `ContextRepository`

2. **Flow API routes created in `my_flow_api/app/api/v1/flows.py`:**
   - `GET /api/v1/contexts/{context_id}/flows` → List flows for context (requires auth + ownership)
   - `POST /api/v1/flows` → Create flow (requires auth, validates context ownership)
   - `GET /api/v1/flows/{id}` → Get single flow (requires auth)
   - `PUT /api/v1/flows/{id}` → Update flow (requires auth)
   - `DELETE /api/v1/flows/{id}` → Delete flow (requires auth)
   - `PATCH /api/v1/flows/{id}/complete` → Mark complete (requires auth)
   - All routes use dependency injection for `FlowRepository`

3. **Authentication middleware enforced:**
   - All routes require valid Logto JWT token
   - `user_id` extracted from token and passed to repository methods
   - Returns 401 for missing/invalid tokens
   - Returns 403 for unauthorized access (e.g., accessing another user's context)

4. **API response models use Pydantic:**
   - All endpoints return `ContextResponse` or `FlowResponse` (or lists)
   - Error responses use FastAPI HTTPException with proper status codes
   - OpenAPI docs auto-generated with full schema documentation

5. **Integration tests created in `my_flow_api/tests/test_api/test_contexts.py` and `test_flows.py`:**
   - Uses `TestClient` with mock authentication
   - Tests all endpoints (success cases + error cases)
   - Tests authorization (401, 403 responses)
   - Tests cascade delete (deleting context deletes flows)
   - At least 80% coverage for API routes

6. **Manual testing verified with 1Password secrets:**
   - Can run `op run -- uvicorn main:app --reload` and test all endpoints locally
   - Postman/Thunder Client collection documented in `my_flow_api/docs/api-testing.md`

---

### Story 2.5: Context Switcher UI Component (shadcn/ui)

**As a** frontend developer,
**I want** a reusable Context Switcher component built with shadcn/ui,
**so that** users can easily switch between contexts with visual distinction.

#### Acceptance Criteria

1. **Context Switcher component created in `my_flow_client/components/contexts/context-switcher.tsx`:**
   - Uses shadcn/ui `Select` component as base
   - Displays context name, icon (emoji), and color indicator
   - Shows current context with visual highlight
   - Dropdown shows all user contexts sorted by most recently used

2. **Styling uses CSS design tokens:**
   - Context colors use `var(--color-accent-work)`, `var(--color-accent-personal)`, etc.
   - Background colors use `var(--color-bg-secondary)`
   - Text colors use `var(--color-text-primary)` and `var(--color-text-secondary)`
   - Spacing uses `var(--space-md)` and `var(--space-sm)`
   - No hardcoded colors or spacing values

3. **Component props typed with TypeScript:**
   ```typescript
   interface ContextSwitcherProps {
     currentContextId: string;
     contexts: Context[];
     onContextChange: (contextId: string) => void;
     className?: string;
   }
   ```

4. **Accessibility requirements met:**
   - Keyboard navigable (Tab, Enter, Arrow keys)
   - Screen reader labels for all interactive elements
   - Focus states visible with `--color-accent-*` border
   - ARIA attributes: `role="combobox"`, `aria-label="Select context"`

5. **Unit tests created in `my_flow_client/__tests__/components/contexts/context-switcher.test.tsx`:**
   - Tests rendering with mock context data
   - Tests keyboard navigation
   - Tests `onContextChange` callback firing
   - Tests accessibility with jest-axe
   - At least 80% coverage

6. **Storybook story created in `my_flow_client/stories/context-switcher.stories.tsx`:**
   - Shows component with 4 contexts (work, personal, rest, social)
   - Shows selected state
   - Shows disabled state
   - Dark mode only (no light mode variant)

---

### Story 2.6: Flow List UI Component (shadcn/ui)

**As a** frontend developer,
**I want** a Flow List component that displays flows with completion status,
**so that** users can view and manage their flows within a context.

#### Acceptance Criteria

1. **Flow List component created in `my_flow_client/components/flows/flow-list.tsx`:**
   - Uses shadcn/ui `Card` and `Badge` components
   - Displays flow title, description (truncated), priority badge, creation date
   - Shows completion status (checkbox icon or checkmark)
   - Supports empty state with illustration and "Create your first flow" message

2. **Flow item component created in `my_flow_client/components/flows/flow-item.tsx`:**
   - Individual flow card with hover state
   - Priority badge colored by priority (high=red, medium=yellow, low=green using tokens)
   - Click to expand/view details
   - Actions menu (Edit, Delete, Mark Complete) using shadcn/ui `DropdownMenu`

3. **Styling uses CSS design tokens:**
   - Card backgrounds use `var(--color-bg-secondary)`
   - Borders use `var(--color-bg-tertiary)`
   - Priority badges use context accent colors
   - Hover states use `var(--shadow-md)`

4. **Component props typed with TypeScript:**
   ```typescript
   interface FlowListProps {
     flows: Flow[];
     onFlowClick: (flowId: string) => void;
     onFlowComplete: (flowId: string) => void;
     onFlowDelete: (flowId: string) => void;
     isLoading?: boolean;
     className?: string;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/flows/flow-list.test.tsx`:**
   - Tests rendering with mock flow data
   - Tests empty state
   - Tests callback functions (click, complete, delete)
   - Tests loading state (skeleton loaders)
   - At least 80% coverage

6. **Storybook story created with multiple states:**
   - List with 5 flows (mixed priorities and completion states)
   - Empty state
   - Loading state
   - Single flow expanded

---

### Story 2.7: TanStack Query Integration for Contexts API

**As a** frontend developer,
**I want** TanStack Query hooks for context API operations,
**so that** we have optimistic updates, caching, and automatic refetching.

#### Acceptance Criteria

1. **API client created in `my_flow_client/lib/api/contexts.ts`:**
   - `fetchContexts()` → GET /api/v1/contexts
   - `fetchContextById(id: string)` → GET /api/v1/contexts/{id}
   - `createContext(data: ContextCreate)` → POST /api/v1/contexts
   - `updateContext(id: string, data: ContextUpdate)` → PUT /api/v1/contexts/{id}
   - `deleteContext(id: string)` → DELETE /api/v1/contexts/{id}
   - All methods use `fetch()` with Logto auth token from session
   - TypeScript types imported from shared types (generated from Pydantic models)

2. **TanStack Query hooks created in `my_flow_client/hooks/use-contexts.ts`:**
   - `useContexts()` → Uses `useQuery` to fetch all contexts
   - `useContext(id: string)` → Uses `useQuery` to fetch single context
   - `useCreateContext()` → Uses `useMutation` with optimistic update
   - `useUpdateContext()` → Uses `useMutation` with optimistic update
   - `useDeleteContext()` → Uses `useMutation` with cache invalidation

3. **Query configuration:**
   - `staleTime: 5 minutes` for context lists (contexts don't change frequently)
   - `refetchOnWindowFocus: true`
   - Error handling with toast notifications (using shadcn/ui `toast`)
   - Optimistic updates for create/update/delete operations

4. **Query keys follow consistent pattern:**
   ```typescript
   const contextKeys = {
     all: ['contexts'] as const,
     lists: () => [...contextKeys.all, 'list'] as const,
     list: (filters: ContextFilters) => [...contextKeys.lists(), filters] as const,
     details: () => [...contextKeys.all, 'detail'] as const,
     detail: (id: string) => [...contextKeys.details(), id] as const,
   }
   ```

5. **Integration tests created in `my_flow_client/__tests__/hooks/use-contexts.test.tsx`:**
   - Uses `@testing-library/react-hooks` and MSW for API mocking
   - Tests successful fetch, create, update, delete
   - Tests optimistic updates
   - Tests error handling
   - At least 80% coverage

6. **Manual testing with 1Password:**
   - Can run `op run -- bun dev` and test all operations in browser
   - Auth token properly injected from Logto session

---

### Story 2.8: TanStack Query Integration for Flows API

**As a** frontend developer,
**I want** TanStack Query hooks for flow API operations,
**so that** we have optimistic updates, caching, and automatic refetching for flow management.

#### Acceptance Criteria

1. **API client created in `my_flow_client/lib/api/flows.ts`:**
   - `fetchFlowsByContext(contextId: string)` → GET /api/v1/contexts/{contextId}/flows
   - `fetchFlowById(id: string)` → GET /api/v1/flows/{id}
   - `createFlow(data: FlowCreate)` → POST /api/v1/flows
   - `updateFlow(id: string, data: FlowUpdate)` → PUT /api/v1/flows/{id}
   - `deleteFlow(id: string)` → DELETE /api/v1/flows/{id}
   - `completeFlow(id: string)` → PATCH /api/v1/flows/{id}/complete
   - All methods use `fetch()` with Logto auth token from session
   - TypeScript types imported from shared types

2. **TanStack Query hooks created in `my_flow_client/hooks/use-flows.ts`:**
   - `useFlows(contextId: string)` → Uses `useQuery` to fetch flows for context
   - `useFlow(id: string)` → Uses `useQuery` to fetch single flow
   - `useCreateFlow()` → Uses `useMutation` with optimistic update
   - `useUpdateFlow()` → Uses `useMutation` with optimistic update
   - `useDeleteFlow()` → Uses `useMutation` with optimistic update
   - `useCompleteFlow()` → Uses `useMutation` with optimistic update

3. **Query configuration:**
   - `staleTime: 2 minutes` for flow lists (flows change more frequently than contexts)
   - `refetchOnWindowFocus: true`
   - Error handling with toast notifications
   - Optimistic updates show immediate feedback (e.g., checkbox checked before API confirms)

4. **Query keys follow consistent pattern:**
   ```typescript
   const flowKeys = {
     all: ['flows'] as const,
     lists: () => [...flowKeys.all, 'list'] as const,
     list: (contextId: string) => [...flowKeys.lists(), contextId] as const,
     details: () => [...flowKeys.all, 'detail'] as const,
     detail: (id: string) => [...flowKeys.details(), id] as const,
   }
   ```

5. **Cache invalidation strategy:**
   - Creating flow invalidates `flowKeys.list(contextId)`
   - Updating flow invalidates both `flowKeys.list(contextId)` and `flowKeys.detail(id)`
   - Deleting flow invalidates `flowKeys.list(contextId)`
   - Completing flow invalidates both queries

6. **Integration tests created in `my_flow_client/__tests__/hooks/use-flows.test.tsx`:**
   - Uses MSW for API mocking
   - Tests successful fetch, create, update, delete, complete
   - Tests optimistic updates (UI reflects changes before API confirms)
   - Tests error rollback (optimistic update reverted on API error)
   - At least 80% coverage

7. **Manual testing with 1Password:**
   - Can run `op run -- bun dev` and test all flow operations
   - Optimistic updates feel instant
   - Error states show toast notifications

---

## Epic 3: AI Conversational Interface & Flow Extraction

**Epic Goal:** Implement AI chat interface with streaming responses and automatic flow extraction from conversation. Users can converse naturally and see flows appear automatically.

**API Contract:**
```
POST   /api/chat/stream           → WebSocket or SSE for AI streaming
POST   /api/chat/extract-flows    → Extract flows from conversation
GET    /api/conversations/{id}    → Get conversation history
```

**Parallel Work Sections:**
- **Backend (Stories 3.1-3.4):** AI service integration, conversation storage, flow extraction
- **Frontend (Stories 3.5-3.8):** Chat UI, streaming message display, flow extraction feedback

---

### Story 3.1: OpenAI/Anthropic SDK Integration & Streaming Service

**As a** backend developer,
**I want** AI SDK configured with streaming support,
**so that** the backend can generate real-time conversational responses.

#### Acceptance Criteria

1. **AI service client created in `my_flow_api/app/services/ai_service.py`:**
   - Configurable provider (OpenAI GPT-4 or Anthropic Claude 3.5) via environment variable
   - `AIService` class with methods: `stream_chat_response()`, `extract_flows_from_text()`
   - Uses async streaming for chat responses (OpenAI: `openai.AsyncStream`, Anthropic: `anthropic.AsyncStream`)

2. **Streaming implementation:**
   - `stream_chat_response(messages: List[Message], context_id: str) -> AsyncGenerator[str, None]`
   - Yields token-by-token response
   - Includes context-specific system prompts (e.g., "You are an assistant for the user's Work context")
   - Handles API errors gracefully (rate limits, timeouts, invalid API keys)

3. **Configuration via 1Password:**
   - API key stored in 1Password vault: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - Provider selection: `AI_PROVIDER=openai` or `AI_PROVIDER=anthropic`
   - Model configuration: `AI_MODEL=gpt-4` or `AI_MODEL=claude-3-5-sonnet-20241022`

4. **Unit tests created in `my_flow_api/tests/test_services/test_ai_service.py`:**
   - Tests streaming with mock AI responses
   - Tests error handling (invalid API keys, timeout)
   - Tests provider switching (OpenAI vs Anthropic)
   - At least 80% coverage

5. **Manual testing with 1Password:**
   - Can run `op run -- uvicorn main:app --reload` and invoke AI service
   - Streaming responses work correctly

---

### Story 3.2: Conversation Storage & Retrieval (MongoDB)

**As a** backend developer,
**I want** conversation history stored in MongoDB with message threading,
**so that** users can review past conversations and maintain context.

#### Acceptance Criteria

1. **Pydantic models created in `my_flow_api/app/models/conversation.py`:**
   - `Message` model: `role` (Literal["user", "assistant", "system"]), `content` (str), `timestamp` (datetime)
   - `Conversation` model: `id` (ObjectId), `context_id` (ObjectId), `messages` (List[Message]), `created_at`, `updated_at`
   - Validators for role enum and message content length

2. **Repository created in `my_flow_api/app/repositories/conversation_repository.py`:**
   - `ConversationRepository` class with methods:
     - `create_conversation(context_id: str) -> ConversationInDB`
     - `get_conversation_by_id(conversation_id: str) -> Optional[ConversationInDB]`
     - `get_conversations_by_context(context_id: str) -> List[ConversationInDB]`
     - `append_message(conversation_id: str, message: Message) -> ConversationInDB`
     - `get_recent_messages(conversation_id: str, limit: int = 20) -> List[Message]`

3. **MongoDB indexes:**
   - Conversations collection: Index on `context_id`, compound index on `(context_id, updated_at desc)`
   - Efficient retrieval of recent conversations per context

4. **Integration tests created in `my_flow_api/tests/test_repositories/test_conversation_repository.py`:**
   - Tests conversation creation and message appending
   - Tests retrieval of recent messages
   - Tests pagination
   - At least 85% coverage

---

### Story 3.3: Flow Extraction from Conversation (AI-Powered)

**As a** backend developer,
**I want** AI to extract actionable flows from conversation text,
**so that** flows are automatically created without manual user input.

#### Acceptance Criteria

1. **Flow extraction method in `my_flow_api/app/services/ai_service.py`:**
   - `extract_flows_from_text(conversation_text: str, context_id: str) -> List[FlowCreate]`
   - Uses AI to identify actionable tasks/flows from conversation
   - Returns structured `FlowCreate` objects with `title`, `description`, `priority`
   - Uses specific prompt engineering: "Extract actionable tasks from the following conversation. Return JSON array of tasks with title, description, and priority (low/medium/high)."

2. **JSON parsing and validation:**
   - AI response parsed as JSON
   - Pydantic validates extracted flows before returning
   - Handles malformed JSON gracefully (returns empty list if parsing fails)

3. **Automatic flow creation integration:**
   - After AI streaming completes, backend calls `extract_flows_from_text()`
   - Extracted flows automatically inserted into database via `FlowRepository.create()`
   - User notified via WebSocket/SSE event: `{"event": "flows_extracted", "flows": [...]}`

4. **Unit tests created in `my_flow_api/tests/test_services/test_flow_extraction.py`:**
   - Tests extraction with sample conversation text
   - Tests JSON parsing edge cases (malformed JSON, empty responses)
   - Tests automatic flow creation
   - At least 80% coverage

5. **Manual testing:**
   - Conversation "I need to finish the presentation, call the client, and book a flight" extracts 3 flows
   - Each flow has appropriate title, description, and priority

---

### Story 3.4: Chat Streaming API Endpoint (WebSocket or SSE)

**As a** backend developer,
**I want** a streaming API endpoint for AI chat,
**so that** the frontend receives real-time token-by-token responses.

#### Acceptance Criteria

1. **WebSocket endpoint created in `my_flow_api/app/api/v1/chat.py`:**
   - `POST /api/v1/chat/stream` (WebSocket or Server-Sent Events)
   - Accepts: `{"context_id": str, "message": str, "conversation_id": Optional[str]}`
   - Streams AI response token-by-token to client
   - After streaming completes, extracts flows and sends `{"event": "flows_extracted", "flows": [...]}`

2. **Authentication enforced:**
   - Requires valid Logto JWT token
   - Verifies user owns the context before streaming

3. **Error handling:**
   - Returns appropriate error codes for invalid context, AI service failures
   - Gracefully handles WebSocket disconnections

4. **Integration tests created in `my_flow_api/tests/test_api/test_chat.py`:**
   - Tests WebSocket/SSE connection and streaming
   - Tests flow extraction after streaming
   - Tests authentication (401, 403 responses)
   - At least 80% coverage

5. **Manual testing with 1Password:**
   - Can run `op run -- uvicorn main:app --reload` and test streaming with WebSocket client (e.g., `websocat`)
   - Streaming responses and flow extraction work end-to-end

---

### Story 3.5: Chat UI Component (shadcn/ui)

**As a** frontend developer,
**I want** a chat interface component with message history,
**so that** users can converse with the AI assistant.

#### Acceptance Criteria

1. **Chat component created in `my_flow_client/components/chat/chat-interface.tsx`:**
   - Uses shadcn/ui `ScrollArea` for message history
   - Message bubbles styled differently for user vs assistant (user=right-aligned accent color, assistant=left-aligned secondary bg)
   - Input field at bottom with shadcn/ui `Textarea` and send button
   - Auto-scrolls to bottom when new messages arrive

2. **Message component created in `my_flow_client/components/chat/message-bubble.tsx`:**
   - Displays message content with proper formatting (markdown support via `react-markdown`)
   - Shows timestamp and role indicator (user icon vs AI icon)
   - Typing indicator for assistant messages in progress

3. **Styling uses CSS design tokens:**
   - User message bubbles use `var(--color-accent-work)` (or context-specific color)
   - Assistant bubbles use `var(--color-bg-secondary)`
   - Text uses `var(--color-text-primary)`
   - Spacing and borders use design tokens

4. **Component props typed with TypeScript:**
   ```typescript
   interface ChatInterfaceProps {
     contextId: string;
     conversationId?: string;
     onFlowsExtracted: (flows: Flow[]) => void;
     className?: string;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/chat/chat-interface.test.tsx`:**
   - Tests rendering with mock messages
   - Tests user input and send button
   - Tests auto-scroll behavior
   - At least 80% coverage

6. **Storybook story created:**
   - Shows empty chat state
   - Shows conversation with 5 messages (mixed user/assistant)
   - Shows typing indicator
   - Dark mode only

---

### Story 3.6: WebSocket/SSE Client for AI Streaming

**As a** frontend developer,
**I want** a WebSocket/SSE client hook for AI streaming,
**so that** messages stream in real-time as the AI generates them.

#### Acceptance Criteria

1. **WebSocket client hook created in `my_flow_client/hooks/use-chat-stream.ts`:**
   - `useChatStream(contextId: string, conversationId?: string)`
   - Opens WebSocket connection to `/api/v1/chat/stream`
   - Sends user message via WebSocket
   - Receives streaming tokens and appends to current assistant message
   - Handles `flows_extracted` event and calls callback

2. **Streaming state management:**
   - Returns `{ messages, sendMessage, isStreaming, error }`
   - `isStreaming` is true while AI is generating response
   - `error` contains any connection or API errors

3. **Authentication:**
   - Includes Logto JWT token in WebSocket connection headers
   - Automatically reconnects if connection drops (max 3 retries)

4. **Integration with TanStack Query:**
   - After flow extraction event, invalidates `flowKeys.list(contextId)` to refresh flow list
   - Optimistic UI update shows extracted flows immediately

5. **Integration tests created in `my_flow_client/__tests__/hooks/use-chat-stream.test.tsx`:**
   - Uses mock WebSocket server for testing
   - Tests sending message and receiving streamed response
   - Tests flow extraction event handling
   - Tests error handling and reconnection
   - At least 80% coverage

6. **Manual testing with 1Password:**
   - Can run `op run -- bun dev` and test streaming in browser
   - Messages stream smoothly without flickering
   - Flow extraction notifications appear correctly

---

### Story 3.7: Flow Extraction Feedback UI

**As a** frontend developer,
**I want** visual feedback when flows are extracted from conversation,
**so that** users understand what the AI has created.

#### Acceptance Criteria

1. **Flow extraction notification component created in `my_flow_client/components/chat/flow-extraction-notification.tsx`:**
   - Uses shadcn/ui `Toast` or inline notification banner
   - Shows: "🎯 Extracted 3 flows from conversation"
   - Click to expand and preview extracted flows
   - "Add All" button to confirm, "Dismiss" to ignore

2. **Flow preview card created:**
   - Mini flow cards showing title, description, priority
   - Uses CSS design tokens for priority colors
   - Hover state shows full description

3. **Optimistic UI update:**
   - Extracted flows appear in flow list immediately (before user confirms)
   - If user dismisses, flows are removed from UI and backend (DELETE request)

4. **Styling uses CSS design tokens:**
   - Notification background uses `var(--color-bg-secondary)`
   - Success indicator uses `var(--color-accent-work)` or context color
   - Spacing and borders use tokens

5. **Unit tests created in `my_flow_client/__tests__/components/chat/flow-extraction-notification.test.tsx`:**
   - Tests rendering with mock extracted flows
   - Tests "Add All" and "Dismiss" actions
   - Tests callback functions
   - At least 80% coverage

6. **Storybook story created:**
   - Shows notification with 1 flow
   - Shows notification with 5 flows
   - Shows expanded preview state

---

### Story 3.8: Chat Integration with Context Switcher

**As a** frontend developer,
**I want** chat history to persist per context and clear when switching contexts,
**so that** conversations are organized by context.

#### Acceptance Criteria

1. **Context-aware chat state:**
   - Chat component receives `contextId` prop from parent
   - When `contextId` changes, chat clears current messages and loads conversation history for new context
   - Uses `useEffect` to trigger conversation loading on context switch

2. **Conversation history loading:**
   - API client method created: `fetchConversationHistory(contextId: string) -> Conversation[]`
   - TanStack Query hook: `useConversationHistory(contextId: string)`
   - Loads most recent conversation for context on mount
   - Displays loading skeleton while fetching

3. **Chat persistence:**
   - Messages are automatically saved to backend after each send/receive
   - No manual save button required
   - Conversation history survives page refresh

4. **Integration with Context Switcher:**
   - When user switches context, chat immediately clears and shows loading state
   - New conversation history loads within 200ms (cached by TanStack Query)
   - Smooth transition with no flickering

5. **Integration tests created in `my_flow_client/__tests__/integration/context-chat-integration.test.tsx`:**
   - Tests switching contexts and chat clearing
   - Tests conversation history loading
   - Tests persistence across refreshes
   - At least 80% coverage

6. **Manual testing with 1Password:**
   - Can run `op run -- bun dev` and test context switching with chat
   - Chat history loads correctly for each context
   - Switching feels instant and smooth

---

## Epic 4: Transition Intelligence & Contextual Mock Data

**Epic Goal:** Add smart context transition features (summaries, suggestions, incomplete flow warnings). Populate app with realistic mock data for demo purposes.

**API Contract:**
```
GET    /api/contexts/{id}/summary           → Context summary
GET    /api/transitions/suggestions         → Transition suggestions
POST   /api/mock-data/generate              → Generate mock data
```

**Parallel Work Sections:**
- **Backend (Stories 4.1-4.3):** Transition logic, context summaries, mock data generation
- **Frontend (Stories 4.4-4.6):** Transition UI, suggestion display, onboarding flow
- **Mock Data (Story 4.7):** Realistic demo data generation

---

### Story 4.1: Context Summary Generation (AI-Powered)

**As a** backend developer,
**I want** AI to generate context summaries showing progress and incomplete flows,
**so that** users get an overview when switching contexts.

#### Acceptance Criteria

1. **Summary generation method in `my_flow_api/app/services/ai_service.py`:**
   - `generate_context_summary(context_id: str, user_id: str) -> ContextSummary`
   - Fetches flows (completed and incomplete) for context
   - Fetches recent conversation highlights
   - Uses AI to generate natural language summary: "You have 3 incomplete flows in your Work context. Last activity: discussed Q4 roadmap."

2. **Summary model created in `my_flow_api/app/models/summary.py`:**
   - `ContextSummary`: `context_id`, `incomplete_flows_count`, `completed_flows_count`, `summary_text` (str), `last_activity` (datetime), `top_priorities` (List[FlowResponse])

3. **API endpoint created in `my_flow_api/app/api/v1/contexts.py`:**
   - `GET /api/v1/contexts/{id}/summary` → Returns `ContextSummary`
   - Requires authentication
   - Caches summary for 5 minutes to reduce AI API calls

4. **Unit tests created in `my_flow_api/tests/test_services/test_summary.py`:**
   - Tests summary generation with mock flows and conversations
   - Tests caching behavior
   - At least 80% coverage

5. **Manual testing:**
   - Summary accurately reflects flows and conversations
   - Summary updates when flows are added/completed

---

### Story 4.2: Transition Suggestions Service

**As a** backend developer,
**I want** intelligent transition suggestions when users switch contexts,
**so that** users are reminded of incomplete flows and priorities.

#### Acceptance Criteria

1. **Suggestions method in `my_flow_api/app/services/transition_service.py`:**
   - `get_transition_suggestions(from_context_id: str, to_context_id: str, user_id: str) -> TransitionSuggestions`
   - Analyzes incomplete flows in target context
   - Identifies high-priority flows due soon
   - Returns structured suggestions: "Before switching, you have 2 high-priority flows in your Work context due today."

2. **Suggestions model created in `my_flow_api/app/models/transition.py`:**
   - `TransitionSuggestions`: `from_context`, `to_context`, `warnings` (List[str]), `suggestions` (List[str]), `urgent_flows` (List[FlowResponse])

3. **API endpoint created in `my_flow_api/app/api/v1/transitions.py`:**
   - `GET /api/v1/transitions/suggestions?from={context_id}&to={context_id}` → Returns `TransitionSuggestions`
   - Requires authentication

4. **Unit tests created in `my_flow_api/tests/test_services/test_transition.py`:**
   - Tests suggestions with various flow states
   - Tests urgency detection (due today, overdue)
   - At least 80% coverage

---

### Story 4.3: Incomplete Flow Warnings

**As a** backend developer,
**I want** warnings when users have incomplete flows in a context,
**so that** users are aware of pending tasks before switching away.

#### Acceptance Criteria

1. **Warning logic in `my_flow_api/app/services/transition_service.py`:**
   - `check_incomplete_flows(context_id: str, user_id: str) -> IncompleteFlowWarning`
   - Counts incomplete flows
   - Identifies overdue flows (past due date)
   - Returns warning object with counts and flow details

2. **Warning model created in `my_flow_api/app/models/transition.py`:**
   - `IncompleteFlowWarning`: `context_id`, `incomplete_count`, `overdue_count`, `overdue_flows` (List[FlowResponse])

3. **Integration with context switch endpoint:**
   - When user switches context, backend returns warning if incomplete flows exist
   - Frontend displays confirmation dialog: "You have 3 incomplete flows in Work. Switch anyway?"

4. **Unit tests created in `my_flow_api/tests/test_services/test_warnings.py`:**
   - Tests warning generation with various flow states
   - Tests overdue detection
   - At least 80% coverage

---

### Story 4.4: Transition Suggestions UI (shadcn/ui)

**As a** frontend developer,
**I want** a UI component showing transition suggestions,
**so that** users see helpful reminders when switching contexts.

#### Acceptance Criteria

1. **Suggestions component created in `my_flow_client/components/transitions/transition-suggestions.tsx`:**
   - Uses shadcn/ui `Dialog` or `Alert` component
   - Displays warnings, suggestions, and urgent flows
   - "Continue" button to proceed with switch
   - "View Flows" button to see details before switching

2. **Styling uses CSS design tokens:**
   - Warning indicators use `var(--color-accent-work)` (or context color)
   - Background uses `var(--color-bg-secondary)`
   - Urgent flows highlighted with red accent

3. **Integration with Context Switcher:**
   - When user selects new context, fetch suggestions from API
   - Display dialog if warnings exist
   - Allow user to proceed or cancel switch

4. **Component props typed with TypeScript:**
   ```typescript
   interface TransitionSuggestionsProps {
     fromContext: Context;
     toContext: Context;
     suggestions: TransitionSuggestions;
     onContinue: () => void;
     onCancel: () => void;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/transitions/transition-suggestions.test.tsx`:**
   - Tests rendering with mock suggestions
   - Tests "Continue" and "Cancel" actions
   - At least 80% coverage

6. **Storybook story created:**
   - Shows suggestions with 2 warnings and 3 urgent flows
   - Shows empty state (no warnings)
   - Dark mode only

---

### Story 4.5: Context Summary Dashboard Widget

**As a** frontend developer,
**I want** a dashboard widget showing summaries for all contexts,
**so that** users can see their progress at a glance.

#### Acceptance Criteria

1. **Dashboard widget created in `my_flow_client/components/dashboard/context-summary-widget.tsx`:**
   - Uses shadcn/ui `Card` components
   - Displays each context with:
     - Context name, icon, color indicator
     - Incomplete flows count
     - Last activity timestamp
     - Mini progress bar (completed vs incomplete)
   - Click to switch to context

2. **Styling uses CSS design tokens:**
   - Context cards use `var(--color-bg-secondary)`
   - Progress bars use context accent colors
   - Spacing and borders use design tokens

3. **Data fetching:**
   - TanStack Query hook: `useContextSummaries()`
   - Fetches summaries for all user contexts
   - Caches for 5 minutes (summaries don't change frequently)

4. **Component props typed with TypeScript:**
   ```typescript
   interface ContextSummaryWidgetProps {
     contexts: Context[];
     summaries: ContextSummary[];
     onContextClick: (contextId: string) => void;
     className?: string;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/dashboard/context-summary-widget.test.tsx`:**
   - Tests rendering with mock contexts and summaries
   - Tests click to switch context
   - At least 80% coverage

6. **Storybook story created:**
   - Shows dashboard with 4 context summaries
   - Shows loading state
   - Dark mode only

---

### Story 4.6: Onboarding Flow for New Users

**As a** frontend developer,
**I want** an onboarding flow that creates sample contexts and flows,
**so that** new users understand the app quickly.

#### Acceptance Criteria

1. **Onboarding modal created in `my_flow_client/components/onboarding/onboarding-modal.tsx`:**
   - Uses shadcn/ui `Dialog` component
   - Multi-step wizard (3 steps):
     - Step 1: Welcome screen explaining contexts
     - Step 2: Create first context (with name, icon, color picker)
     - Step 3: Add first flow manually or via AI chat
   - "Skip" button to dismiss

2. **Sample context creation:**
   - "Get Started" button creates 4 default contexts: Work, Personal, Rest, Social
   - Each context has sample flows (3-5 flows per context)
   - Uses mock data generation API or frontend-only data

3. **Onboarding trigger:**
   - Modal appears on first login (checks if user has 0 contexts)
   - Can be manually triggered from settings

4. **Styling uses CSS design tokens:**
   - Modal background uses `var(--color-bg-primary)`
   - Buttons use context accent colors
   - Spacing and typography use design tokens

5. **Unit tests created in `my_flow_client/__tests__/components/onboarding/onboarding-modal.test.tsx`:**
   - Tests multi-step wizard navigation
   - Tests sample context creation
   - Tests skip action
   - At least 80% coverage

6. **Storybook story created:**
   - Shows each onboarding step
   - Shows completed state
   - Dark mode only

---

### Story 4.7: Mock Data Generation (Backend & Frontend)

**As a** developer,
**I want** realistic mock data for demo purposes,
**so that** the app looks populated and users can evaluate functionality.

#### Acceptance Criteria

1. **Mock data script created in `my_flow_api/scripts/generate_mock_data.py`:**
   - Generates 4 contexts: Work, Personal, Fitness, Learning
   - Generates 20-30 flows per context (mix of completed and incomplete)
   - Generates conversation history (10-15 messages per context)
   - Uses realistic text (e.g., "Finish Q4 presentation", "Call dentist for appointment")

2. **API endpoint created in `my_flow_api/app/api/v1/mock_data.py`:**
   - `POST /api/v1/mock-data/generate` → Generates mock data for authenticated user
   - Protected endpoint (only available in development/staging, not production)
   - Returns: `{"contexts_created": 4, "flows_created": 100, "conversations_created": 4}`

3. **Frontend mock data button:**
   - Settings page includes "Generate Mock Data" button (only visible in dev mode)
   - Calls API endpoint and refreshes all contexts/flows

4. **Quality criteria:**
   - Mock flows have varied priorities (high, medium, low)
   - Mock flows have realistic due dates (some overdue, some upcoming, some far future)
   - Mock conversations include flow extraction examples
   - Mock data demonstrates all features (completed flows, incomplete flows, context switching)

5. **Unit tests created in `my_flow_api/tests/test_scripts/test_mock_data.py`:**
   - Tests mock data generation
   - Verifies correct counts and data structure
   - At least 80% coverage

6. **Documentation:**
   - README includes instructions for generating mock data
   - Example: `op run -- python scripts/generate_mock_data.py --user-id=<user_id>`

---

## Epic 5: Comprehensive Testing, Performance Optimization & Production Deployment

**Epic Goal:** Achieve comprehensive test coverage for both backend (80%+) and frontend (70%+), optimize performance (caching, query optimization, bundle size), and deploy to production with full monitoring and observability.

### Story 5.1: Backend Comprehensive Test Coverage

**As a** developer,
**I want** comprehensive test coverage for all backend services,
**so that** I can confidently deploy changes without introducing regressions.

#### Acceptance Criteria

1. **Unit tests created for all repositories:**
   - `tests/test_repositories/test_context_repository.py` → Tests CRUD operations, filtering, error handling
   - `tests/test_repositories/test_flow_repository.py` → Tests CRUD operations, filtering, error handling
   - At least 90% coverage for repository layer

2. **Unit tests created for all services:**
   - `tests/test_services/test_ai_service.py` → Tests prompt generation, streaming, error handling
   - `tests/test_services/test_flow_extraction_service.py` → Tests extraction logic, validation
   - `tests/test_services/test_transition_service.py` → Tests suggestions, summaries, warnings
   - At least 85% coverage for service layer

3. **Integration tests created for all API endpoints:**
   - `tests/test_api/test_contexts.py` → Tests all Context endpoints end-to-end
   - `tests/test_api/test_flows.py` → Tests all Flow endpoints end-to-end
   - `tests/test_api/test_ai.py` → Tests AI streaming endpoint
   - Uses test MongoDB instance (not production)
   - At least 80% coverage for API layer

4. **Test fixtures and utilities:**
   - `tests/conftest.py` includes reusable fixtures (test DB, test user, auth headers)
   - Factory methods for creating test data (contexts, flows, conversations)

5. **Overall backend coverage:**
   - `pytest --cov=app tests/` shows at least 80% overall coverage
   - Coverage report generated in `htmlcov/index.html`

6. **CI/CD integration:**
   - GitHub Actions runs all tests on PR
   - Tests must pass before merge

---

### Story 5.2: Backend API Performance & Caching

**As a** user,
**I want** fast API response times,
**so that** the app feels snappy and responsive.

#### Acceptance Criteria

1. **Redis caching implemented for context summaries:**
   - Context summaries cached for 15 minutes
   - Cache key: `context_summary:{user_id}:{context_id}`
   - Cache invalidated on context update or flow completion

2. **MongoDB query optimization:**
   - All queries use appropriate indexes
   - Indexes created in `app/db/indexes.py`:
     - `contexts`: `{user_id: 1, name: 1}`
     - `flows`: `{user_id: 1, context_id: 1, status: 1, due_date: 1}`
     - `conversations`: `{user_id: 1, context_id: 1, timestamp: 1}`

3. **Response time benchmarks:**
   - `GET /api/v1/contexts` → < 100ms (p95)
   - `GET /api/v1/flows` → < 150ms (p95)
   - `POST /api/v1/ai/chat` → First token < 500ms (p95)

4. **Performance tests created in `tests/test_performance/test_api_benchmarks.py`:**
   - Uses `pytest-benchmark` or similar
   - Tests response times under load (100 requests/sec)

5. **Pagination implemented for all list endpoints:**
   - Default page size: 50
   - Max page size: 200
   - Returns: `{data: [...], total: 1000, page: 1, page_size: 50}`

6. **Monitoring:**
   - Prometheus metrics exposed at `/metrics`
   - Metrics include: request count, response time, cache hit rate

---

### Story 5.3: MongoDB Atlas Optimization & Data Retention

**As a** developer,
**I want** to optimize MongoDB usage to stay within free tier limits,
**so that** the app remains cost-effective.

#### Acceptance Criteria

1. **Database size monitoring:**
   - Script created: `scripts/check_db_size.py` → Reports collection sizes
   - Example: `Contexts: 5MB, Flows: 10MB, Conversations: 15MB, Total: 30MB / 512MB`

2. **Data retention policies implemented:**
   - Completed flows older than 90 days are archived or deleted
   - Conversation history older than 30 days is truncated (keep last 50 messages per context) and API accepts at most 50 messages per request.
   - Script: `scripts/cleanup_old_data.py` (runs weekly via cron or scheduled task)

3. **TTL indexes created:**
   - `conversations` collection has TTL index on `timestamp` field (30 days)
   - `flows` collection has TTL index on `completed_at` field (90 days for completed flows)

4. **Query optimization:**
   - All queries use projection to return only needed fields
   - Example: `db.contexts.find({user_id}, {name: 1, icon: 1, color: 1})` (excludes large fields like `flows`)

5. **Connection pooling:**
   - Motor connection pool size: 10-50 connections
   - Connection timeout: 5 seconds

6. **Alerts:**
   - Script sends alert when DB size exceeds 400MB (80% of free tier limit)

---

### Story 5.4: Backend Monitoring & Error Tracking

**As a** developer,
**I want** comprehensive monitoring and error tracking,
**so that** I can quickly identify and resolve production issues.

#### Acceptance Criteria

1. **Sentry integration for error tracking:**
   - Sentry SDK initialized in `app/main.py`
   - Environment: production
   - Sample rate: 100% errors, 10% transactions
   - Captures: exceptions, slow API requests (> 1s), failed DB queries

2. **Structured logging:**
   - All logs use JSON format (for better parsing)
   - Log levels: DEBUG (dev), INFO (staging), WARNING (production)
   - Logs include: `user_id`, `request_id`, `endpoint`, `duration_ms`, `status_code`

3. **Health check endpoint:**
   - `GET /health` → Returns `{"status": "ok", "db": "connected", "cache": "connected"}`
   - Used by monitoring services (Railway, Render, Fly.io)

4. **Application metrics (Prometheus):**
   - Request count by endpoint and status code
   - Request duration histogram (p50, p95, p99)
   - Database query duration
   - Cache hit rate
   - Active WebSocket connections

5. **Alerting:**
   - Sentry alerts on error rate > 5% for 5 minutes
   - Monitoring service alerts on health check failure

6. **Dashboard:**
   - Grafana or built-in monitoring dashboard (Railway, Render, Fly.io)
   - Displays: request rate, response time, error rate, DB size

---

### Story 5.5: Frontend Comprehensive Test Coverage

**As a** developer,
**I want** comprehensive test coverage for all frontend components,
**so that** I can confidently make UI changes without breaking existing functionality.

#### Acceptance Criteria

1. **Unit tests created for all components (Vitest + React Testing Library):**
   - `components/__tests__/context-switcher.test.tsx` → Tests rendering, click events, context switching
   - `components/__tests__/flow-list.test.tsx` → Tests rendering, filtering, completion
   - `components/__tests__/chat.test.tsx` → Tests message rendering, streaming, flow extraction
   - At least 70% coverage for component layer

2. **Unit tests created for all hooks:**
   - `hooks/__tests__/use-contexts.test.ts` → Tests TanStack Query hooks, mutations
   - `hooks/__tests__/use-flows.test.ts` → Tests TanStack Query hooks, mutations
   - Mock API responses using MSW (Mock Service Worker)

3. **Integration tests (React Testing Library):**
   - Tests full user flows (e.g., create context → add flow → mark complete)
   - Tests AI chat flow (send message → receive streaming response → extract flow)
   - Tests context switching flow (switch context → see updated flows)

4. **E2E tests (Playwright):**
   - `e2e/auth.spec.ts` → Tests Logto login/logout
   - `e2e/contexts.spec.ts` → Tests context CRUD operations
   - `e2e/flows.spec.ts` → Tests flow CRUD operations
   - `e2e/ai-chat.spec.ts` → Tests AI chat and flow extraction
   - Runs against local development server

5. **Overall frontend coverage:**
   - `bun test --coverage` shows at least 70% overall coverage
   - Coverage report generated in `coverage/index.html`

6. **CI/CD integration:**
   - GitHub Actions runs all tests on PR
   - E2E tests run on merge to main

---

### Story 5.6: Frontend Bundle Optimization & Code Splitting

**As a** user,
**I want** fast initial page load times,
**so that** the app feels responsive even on slow connections.

#### Acceptance Criteria

1. **Code splitting implemented:**
   - All routes use dynamic imports: `const ChatPage = dynamic(() => import('@/app/chat/page'))`
   - Large components (e.g., chat, flow editor) lazy-loaded
   - shadcn/ui components tree-shaken (only import what's used)

2. **Bundle size targets:**
   - Initial bundle: < 200KB (gzipped)
   - Total JS: < 500KB (gzipped)
   - Run `bun run build` and check `.next/analyze` (if bundle analyzer enabled)

3. **Image optimization:**
   - All images use Next.js `<Image>` component
   - Images served as WebP with fallback
   - Icons use SVG or icon font (not images)

4. **Font optimization:**
   - Fonts loaded using `next/font` (automatic optimization)
   - Font subset includes only used characters

5. **Third-party dependencies:**
   - Review dependencies with `bun pm ls --depth=0`
   - Remove unused dependencies
   - Replace large libraries with lighter alternatives if possible

6. **Performance budgets enforced:**
   - Lighthouse CI in GitHub Actions
   - Fails build if performance score < 90

---

### Story 5.7: Frontend Performance Profiling & Optimization

**As a** user,
**I want** smooth scrolling and interactions,
**so that** the app feels polished and professional.

#### Acceptance Criteria

1. **React Performance Optimization:**
   - All list components use virtualization (e.g., `react-window` or `@tanstack/react-virtual`)
   - Large lists (flows, conversations) render only visible items
   - All expensive computations use `useMemo`
   - All callbacks use `useCallback` to prevent unnecessary re-renders

2. **TanStack Query optimization:**
   - Stale time set appropriately (e.g., 5 minutes for contexts, 1 minute for flows)
   - Optimistic updates for all mutations (instant feedback)
   - Cache garbage collection configured (remove unused data after 10 minutes)

3. **WebSocket/SSE optimization:**
   - Connection pooling (reuse connection for multiple chats)
   - Automatic reconnection on disconnect
   - Backpressure handling (don't overwhelm UI with too many messages)

4. **CSS optimization:**
   - All animations use `transform` and `opacity` (GPU-accelerated)
   - Avoid layout thrashing (batch DOM reads/writes)
   - Use `will-change` sparingly (only for elements currently animating)

5. **Lighthouse performance audit:**
   - Run `bun run build && bun run start`, then Lighthouse audit
   - Performance score: ≥ 90
   - First Contentful Paint (FCP): < 1.5s
   - Largest Contentful Paint (LCP): < 2.5s
   - Cumulative Layout Shift (CLS): < 0.1

6. **Real User Monitoring (RUM):**
   - Vercel Analytics or similar integrated
   - Tracks: page load time, Time to Interactive, Core Web Vitals

---

### Story 5.8: Frontend Monitoring & Error Tracking

**As a** developer,
**I want** to track frontend errors and performance issues,
**so that** I can improve user experience.

#### Acceptance Criteria

1. **Sentry integration for error tracking:**
   - Sentry SDK initialized in `app/layout.tsx`
   - Environment: production
   - Sample rate: 100% errors, 10% transactions
   - Captures: exceptions, unhandled promise rejections, React errors

2. **Error boundaries:**
   - Global error boundary in `app/error.tsx`
   - Per-route error boundaries for critical sections (chat, flows)
   - Error UI shows friendly message + "Report Issue" button

3. **Performance monitoring:**
   - Sentry tracks: page load time, route change duration, API request duration
   - Web Vitals tracked: LCP, FID, CLS

4. **User feedback:**
   - "Report Bug" button in settings
   - Opens modal with pre-filled Sentry issue (includes user context, recent actions)

5. **Analytics events:**
   - Track key user actions: context created, flow completed, AI chat sent
   - Use privacy-respecting analytics (e.g., Plausible, Fathom, or Vercel Analytics)

6. **Console logging:**
   - Development: all logs enabled
   - Production: only errors and warnings (no debug logs)

---

### Story 5.9: Production Deployment & Smoke Tests

**As a** developer,
**I want** to deploy the app to production with confidence,
**so that** users can access the app reliably.

#### Acceptance Criteria

1. **Backend deployed to Railway/Render/Fly.io:**
   - Environment variables configured via 1Password service account
   - Example Railway deployment command: `op run --env-file=.env.template -- railway up`
   - Health check endpoint configured: `/health`
   - Auto-deploy on merge to `main` branch

2. **Frontend deployed to Vercel:**
   - Environment variables configured via Vercel UI (using 1Password values)
   - Auto-deploy on merge to `main` branch
   - Preview deployments for PRs

3. **MongoDB Atlas:**
   - Production database cluster created (free tier)
   - Database name: `myflow_prod`
   - IP whitelist: `0.0.0.0/0` (allow from anywhere) or specific IPs
   - Backup enabled (automatic daily backups)

4. **Smoke tests after deployment:**
   - Manual checklist:
     - ✓ Can log in via Logto
     - ✓ Can create a context
     - ✓ Can create a flow
     - ✓ Can send AI chat message
     - ✓ Can mark flow as complete
     - ✓ Can switch contexts
   - Automated smoke tests (Playwright against production URL)

5. **Rollback plan:**
   - Document rollback process (Vercel: revert deployment, Railway: redeploy previous version)
   - Test rollback in staging environment

6. **Documentation:**
   - README includes deployment instructions
   - `.env.template` documents all required environment variables

---

### Story 5.10: Monitoring Dashboard & Alerts

**As a** developer,
**I want** a unified monitoring dashboard,
**so that** I can quickly assess system health and respond to issues.

#### Acceptance Criteria

1. **Monitoring dashboard created:**
   - Option A: Use Grafana + Prometheus (self-hosted or Grafana Cloud)
   - Option B: Use built-in monitoring (Railway, Render, Fly.io, Vercel)
   - Displays:
     - Backend: Request rate, response time (p50/p95/p99), error rate, DB size
     - Frontend: Page load time, Core Web Vitals (LCP, FID, CLS), error rate

2. **Alerting rules configured:**
   - Backend error rate > 5% for 5 minutes → Slack/email alert
   - Backend p95 response time > 2s for 5 minutes → Slack/email alert
   - Database size > 400MB (80% of free tier) → Slack/email alert
   - Frontend error rate > 2% for 5 minutes → Slack/email alert
   - Health check failure → Immediate Slack/email alert

3. **Uptime monitoring:**
   - Use UptimeRobot, Checkly, or similar
   - Check every 5 minutes
   - Alert on downtime > 2 minutes

4. **Status page:**
   - Public status page (e.g., status.myflow.app)
   - Shows: API status, frontend status, database status, incidents

5. **On-call rotation (if team > 1 person):**
   - PagerDuty or similar integration
   - Escalation policy: primary on-call → backup on-call → team lead

6. **Runbook:**
   - Document common issues and resolutions:
     - Database connection failure → Check MongoDB Atlas status, restart backend
     - High error rate → Check Sentry, identify common error, deploy fix
     - Slow response time → Check DB query performance, Redis cache hit rate

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 95%

**MVP Scope Appropriateness:** Just Right

**Readiness for Architecture Phase:** Ready

**Key Strengths:**
- Comprehensive epic and story breakdown (41 stories across 5 epics)
- Clear technical constraints and preferences documented upfront (1Password CLI, design tokens, testing requirements)
- Strong non-functional requirements with specific, measurable targets (80% backend coverage, 70% frontend coverage, MongoDB free tier optimization)
- Logical epic sequencing with parallel frontend/backend work structure in Epics 2-5
- Detailed acceptance criteria for every story, including local testability where appropriate

**Most Critical Gaps:**
- None blocking architecture phase
- Minor: Project Brief reference exists but not attached/linked (acceptable for brownfield enhancement)
- Minor: Market/competitive analysis not included (acceptable for internal tooling/MVP)

---

### Category Analysis

| Category | Status | Critical Issues | Details |
|----------|--------|-----------------|---------|
| 1. Problem Definition & Context | PASS | None | Clear problem statement in Background Context. Goals explicitly tie to context-switching pain. Success implicitly defined through FRs/NFRs. No formal user research documented (acceptable for personal MVP). |
| 2. MVP Scope Definition | PASS | None | Scope is well-defined with 17 FRs and 15 NFRs. Out-of-scope items implicitly clear (no mobile apps, no team collaboration). 5 epics represent true MVP: foundation → data layer → AI → intelligence → deployment. |
| 3. User Experience Requirements | PASS | None | UI Design Goals section comprehensive: UX vision, interaction paradigms, 5 core screens, WCAG AA, branding (dark mode, design tokens). User flows implied through stories but not explicitly diagrammed (acceptable). |
| 4. Functional Requirements | PASS | None | 17 FRs cover all core functionality. Requirements testable and unambiguous. Stories use consistent format with comprehensive acceptance criteria. Dependencies clear through epic sequencing. |
| 5. Non-Functional Requirements | PASS | None | 15 NFRs with specific targets: latency (200ms CRUD, 2s AI), test coverage (80%/70%), storage (512MB MongoDB free tier), accessibility (WCAG AA), deployment (Vercel/Railway free tiers). |
| 6. Epic & Story Structure | PASS | None | 5 epics, 41 stories. Epic 1 establishes foundation (project setup, auth, 1Password CLI, CI/CD). Epics 2-5 enable parallel work. Stories appropriately sized for single-agent execution. All ACs testable. |
| 7. Technical Guidance | PASS | None | Technical Assumptions section comprehensive: Monorepo, Next.js 15/React 19, FastAPI/Python 3.12, MongoDB Atlas, Logto, 1Password CLI, shadcn/ui, Tailwind with tokens, TypeScript strict, mypy strict, comprehensive testing. |
| 8. Cross-Functional Requirements | PASS | None | Data entities (Context, Flow, Conversation) defined through stories. Storage (MongoDB Atlas 512MB), retention policies (Story 5.3), monitoring (Stories 5.4, 5.8, 5.10) all covered. Schema evolution tied to stories. |
| 9. Clarity & Communication | PASS | None | Consistent terminology, well-structured sections, technical terms defined (e.g., "flows" = task sequences). Diagrams not included but not critical. Version tracked in Change Log. |

---

### Top Issues by Priority

**BLOCKERS:** None

**HIGH:** None

**MEDIUM:**
1. **Project Brief not linked** - PRD references Project Brief in Goals section but not attached. If it exists, add link. If not, this is acceptable for MVP continuation.
2. **User flow diagrams not included** - While stories imply user flows (login → create context → chat → extract flow → mark complete), explicit flow diagrams would help UX Expert. Not blocking.

**LOW:**
1. **Market/competitive analysis not included** - Acceptable for personal tooling MVP. Could strengthen PRD for future pitching/fundraising.
2. **Timeline/effort estimation not included** - Acceptable at PRD phase. Architect and Dev will estimate during implementation.

---

### MVP Scope Assessment

**✅ Scope is Just Right:**

**Why MVP scope is appropriate:**
- **Epic 1** delivers foundational infrastructure + basic auth (deployable canary)
- **Epic 2** delivers core data layer + basic UI (contexts and flows CRUD functional)
- **Epic 3** delivers AI conversation + flow extraction (core value proposition functional)
- **Epic 4** delivers transition intelligence + demo data (enhanced UX, demo-ready)
- **Epic 5** delivers production readiness (testing, performance, monitoring, deployment)

**No features should be cut** - Every epic delivers incremental value:
- Epic 1: Infrastructure (required for all subsequent work)
- Epic 2: CRUD operations (required for Epic 3's AI to have data to work with)
- Epic 3: AI conversation (core differentiator, primary value)
- Epic 4: Transition intelligence (makes context switching valuable, justifies "My Flow" concept)
- Epic 5: Production deployment (required for MVP validation with real users)

**No critical features missing:**
- Authentication: ✓ (Story 1.2)
- Context management: ✓ (Stories 2.1-2.6)
- Flow management: ✓ (Stories 2.1-2.4, 2.7-2.8)
- AI conversation: ✓ (Stories 3.1-3.8)
- Transition intelligence: ✓ (Stories 4.1-4.5)
- Testing: ✓ (Stories 5.1, 5.5)
- Deployment: ✓ (Story 5.9)

**Complexity well-managed:**
- Stories appropriately sized for single-agent execution
- Parallel work enabled in Epics 2-5 (backend and frontend can proceed simultaneously)
- Testing integrated throughout (not bolted on at end)
- Production concerns addressed progressively (monitoring in Stories 5.4, 5.8, 5.10)

**Timeline realism:**
- 41 stories, assuming 2-4 hours per story = 82-164 hours total
- With 2 agents working in parallel (backend + frontend): 41-82 hours wall-clock time
- ~2-4 weeks for solo developer, ~1-2 weeks for pair
- Realistic for MVP scope

---

### Technical Readiness

**✅ Clarity of Technical Constraints: Excellent**

All major technical decisions pre-made and documented:
- **Frontend:** Next.js 15, React 19, TypeScript strict, Bun, Tailwind 4 + tokens, shadcn/ui, TanStack Query, Vitest/Playwright
- **Backend:** FastAPI 0.115+, Python 3.12+, Pydantic v2, mypy strict, Motor (async MongoDB), Poetry/uv, pytest
- **Infrastructure:** MongoDB Atlas (512MB free tier), Logto (auth), 1Password CLI (secrets), Vercel (frontend), Railway/Render (backend)
- **Non-negotiables:** 1Password CLI for all secrets, CSS design tokens, dark mode only, 80%/70% test coverage

**✅ Identified Technical Risks: Well-Covered**

| Risk | Mitigation in PRD |
|------|-------------------|
| MongoDB free tier overflow | Story 5.3: TTL indexes, data retention, size monitoring, cleanup scripts |
| AI streaming latency | NFR1: <2s response time target, Story 3.1: streaming implementation, Story 5.2: Redis caching for summaries |
| Context switching performance | NFR2: <500ms target, Story 2.7-2.8: TanStack Query with optimistic updates |
| Test coverage goals | Story 5.1 (backend 80%+), Story 5.5 (frontend 70%+), CI/CD integration |
| Production monitoring | Stories 5.4 (backend), 5.8 (frontend), 5.10 (unified dashboard) |

**✅ Areas Needing Architect Investigation: Clearly Identified**

1. **WebSocket vs SSE for AI streaming** - Story 3.4 acceptance criteria lists both options, architect should choose based on Vercel/Railway support
2. **Redis caching infrastructure** - Story 5.2 introduces Redis, architect should determine if free tier available or if in-memory caching sufficient for MVP
3. **Monitoring stack choice** - Story 5.10 offers Grafana+Prometheus vs built-in monitoring, architect should choose based on hosting platform capabilities

---

### Recommendations

**✅ PRD is Ready for Architect - No blocking actions required**

**Suggested Improvements (Optional):**

1. **Add Project Brief link** - If Project Brief exists, add link in Goals section for reference. If not, document key insights from briefing in Goals/Background sections.

2. **Consider user flow diagrams** - Simple flowcharts for 3 primary flows would help UX Expert:
   - New user onboarding (login → create first context → first conversation → first flow extraction)
   - Context switching (switch context → see summary → see incomplete flows → resume work)
   - AI conversation to flow completion (chat → extract flow → edit details → mark complete)

3. **Clarify Redis requirement** - Story 5.2 introduces Redis for caching. Verify free tier availability on Railway/Render or plan in-memory fallback for MVP.

**Next Steps:**

1. ✅ **Hand off to UX Expert** - Create high-fidelity mockups for 5 core screens, component library with shadcn/ui + tokens
2. ✅ **Hand off to Architect** - Design system architecture (API contracts, data models, deployment topology), resolve WebSocket/SSE and Redis decisions
3. Architect outputs → Feed into Dev Agent for implementation
4. Epic 1 Story 1.1 starts implementation

---

### PRD Validation Score: 95/100

**Breakdown:**
- Problem Definition: 9/10 (minor: no formal user research)
- MVP Scope: 10/10 (excellent balance, clear boundaries)
- UX Requirements: 9/10 (minor: no flow diagrams)
- Functional Requirements: 10/10 (comprehensive, testable)
- Non-Functional Requirements: 10/10 (specific, measurable)
- Epic/Story Structure: 10/10 (logical, well-sized, sequential)
- Technical Guidance: 10/10 (comprehensive, unambiguous)
- Cross-Functional: 10/10 (data, integration, ops covered)
- Clarity: 9/10 (minor: Project Brief reference)

---

### Final Decision

**✅ READY FOR ARCHITECT**

The PRD and epics are comprehensive, properly structured, and ready for architectural design. All technical constraints are documented, MVP scope is appropriate, and story sequencing is logical. No blocking issues identified.

**Confidence Level:** High

**Recommended Next Action:** Generate UX Expert and Architect prompts, then hand off to UX Expert for design system creation.

---

## Next Steps

### UX Expert Prompt

**Context:** The PRD for "My Flow" (AI-powered context-switching companion) is complete with 41 user stories across 5 epics. The application requires a dark-mode-only design with CSS design tokens, shadcn/ui components, and context-specific accent colors.

**Your Task:** Create the UX/UI design system and high-fidelity mockups for the My Flow application.

**Deliverables:**

1. **Design System Documentation** including:
   - Complete CSS design token definitions (colors, typography, spacing, shadows, animations)
   - Context-specific color schemes (work=blue, personal=orange, rest=purple, social=green)
   - Component specifications for all shadcn/ui components used (Button, Input, Card, Dialog, Dropdown, etc.)
   - Accessibility guidelines (WCAG AA compliance, keyboard navigation, focus states)

2. **High-Fidelity Mockups** for 5 core screens:
   - Login Screen (Logto integration)
   - Main Dashboard (context overview with flow counts)
   - Context Chat View (AI conversation + flow list)
   - Flow Management Panel (list view with quick actions)
   - Settings Page (context management, preferences)

3. **Interaction Specifications:**
   - Context switcher (always visible, single-click transitions)
   - AI chat streaming behavior (typing indicators, progressive disclosure)
   - Flow extraction feedback (AI suggests flow → user confirms/edits)
   - Optimistic update patterns (immediate UI feedback)

**Key Constraints:**
- Dark mode only (deep blacks/grays: `#0a0a0a`, `#1a1a1a`, `#2a2a2a`)
- Use shadcn/ui components exclusively (built on Radix UI)
- Tailwind CSS 4 with CSS custom properties (no arbitrary values)
- Mobile-responsive (though desktop is primary target)
- WCAG AA accessibility standards

**Reference:** See PRD sections "User Interface Design Goals" and "Technical Assumptions" for complete requirements.

**Next Step After Completion:** Hand off design system and mockups to Architect for technical implementation planning.

---

### Architect Prompt

**Context:** The PRD for "My Flow" (AI-powered context-switching companion) is complete with 41 user stories across 5 epics. All technical preferences are documented, including: Monorepo structure, Next.js 15 + React 19 (frontend), FastAPI + Python 3.12 (backend), MongoDB Atlas (512MB free tier), Logto (auth), 1Password CLI (secrets), and comprehensive testing requirements (80% backend, 70% frontend).

**Your Task:** Design the complete system architecture for the My Flow application, resolving technical decisions and creating implementation-ready specifications.

**Deliverables:**

1. **System Architecture Diagram** including:
   - Frontend architecture (Next.js App Router, component structure, state management)
   - Backend architecture (FastAPI service layers, repository pattern, MongoDB collections)
   - Infrastructure topology (Vercel, Railway/Render, MongoDB Atlas, Logto)
   - Data flow (API calls, WebSocket/SSE streaming, authentication flow)

2. **API Contract Specification** for all endpoints:
   - REST endpoints: `/api/v1/contexts`, `/api/v1/flows`, `/api/v1/conversations`
   - WebSocket/SSE endpoint: `/api/v1/ai/chat` (choose WebSocket vs SSE based on platform support)
   - Authentication: Logto JWT validation middleware
   - Request/response schemas (Pydantic models, TypeScript types)

3. **Data Model Design:**
   - MongoDB collections: `users`, `contexts`, `flows`, `conversations`
   - Schema definitions with indexes (see Story 5.2 for index requirements)
   - TTL indexes for data retention (Story 5.3: 30d conversations, 90d completed flows)

4. **Technical Decisions:**
   - **WebSocket vs SSE for AI streaming:** Choose based on Vercel/Railway support and recommend implementation approach
   - **Redis caching:** Determine if free tier Redis available (Railway/Render) or use in-memory caching for MVP (Story 5.2)
   - **Monitoring stack:** Choose between Grafana+Prometheus vs built-in platform monitoring (Story 5.10)

5. **Development Workflow:**
   - Monorepo structure: `/my_flow_client` (Next.js), `/my_flow_api` (FastAPI)
   - Local development setup: Docker Compose for MongoDB, 1Password CLI for secrets (`op run --env-file=.env.template -- bun dev`)
   - CI/CD pipeline: GitHub Actions with 1Password service accounts, auto-deploy to Vercel/Railway on merge to `main`

6. **Implementation Roadmap:**
   - Confirm epic sequencing is feasible (Epic 1 → 2 → 3 → 4 → 5)
   - Identify any missing infrastructure or tooling needs
   - Flag any architectural risks requiring proof-of-concept

**Key Constraints:**
- MongoDB Atlas free tier: 512MB storage limit (implement data retention, monitoring)
- 1Password CLI for ALL secrets (no `.env` files in repo)
- TypeScript strict mode (frontend), mypy strict mode (backend)
- Test coverage: 80% backend, 70% frontend
- Performance targets: <200ms CRUD, <2s AI streaming, <500ms context switching

**Reference:** See PRD sections "Requirements" (17 FRs, 15 NFRs), "Technical Assumptions", and all Epic stories (1.1-5.10) for complete specifications.

**Next Step After Completion:** Hand off architecture documentation to Dev Agent for Epic 1 Story 1.1 implementation (project setup).
