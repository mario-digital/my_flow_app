# Epic 1: Foundation, Authentication & Project Setup

**Epic Goal:** Establish the foundational infrastructure for both frontend and backend, implement authentication via Logto, configure CI/CD pipelines, and achieve a fully deployable "Hello World" system with health checks and environment variable management via 1Password CLI. This epic is intentionally serial to establish the foundation before parallel work begins in Epic 2.

---

## Story 1.1: Project Structure, Git Setup & 1Password CLI Integration

**As a** developer,
**I want** a complete project structure with Git, environment templates, and 1Password CLI secret management,
**so that** both frontend and backend teams can work securely without committing secrets to version control.

### Acceptance Criteria

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

## Story 1.2: Logto Authentication Setup (Backend)

**As a** backend developer,
**I want** Logto JWT authentication configured in FastAPI,
**so that** all API endpoints can validate user identity and protect resources.

### Acceptance Criteria

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

## Story 1.3: Logto Authentication Setup (Frontend)

**As a** frontend developer,
**I want** Logto authentication configured in Next.js,
**so that** users can sign in and the app can make authenticated API requests.

### Acceptance Criteria

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

## Story 1.4: MongoDB Atlas Setup & Connection

**As a** backend developer,
**I want** MongoDB Atlas free tier configured and connected to FastAPI,
**so that** the application can persist user data securely.

### Acceptance Criteria

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

## Story 1.5: CI/CD Pipeline with GitHub Actions

**As a** developer,
**I want** automated CI/CD pipelines for testing and deployment,
**so that** code quality is maintained and deployments are reliable.

### Acceptance Criteria

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

## Story 1.6: Vercel Deployment Configuration (Frontend)

**As a** frontend developer,
**I want** the Next.js app deployed to Vercel with environment variables,
**so that** the production app is accessible and authenticated.

### Acceptance Criteria

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

## Story 1.7: Railway/Render/Fly.io Deployment Configuration (Backend)

**As a** backend developer,
**I want** the FastAPI app deployed to Railway/Render/Fly.io with environment variables,
**so that** the production API is accessible and secure.

### Acceptance Criteria

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

## Story 1.8: Docker Compose for Local Development

**As a** developer,
**I want** Docker Compose configured for local development with all services,
**so that** the entire stack runs consistently across machines without manual setup.

### Acceptance Criteria

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
