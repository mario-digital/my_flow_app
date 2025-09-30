# Epic 5: Comprehensive Testing, Performance Optimization & Production Deployment

**Epic Goal:** Achieve comprehensive test coverage for both backend (80%+) and frontend (70%+), optimize performance (caching, query optimization, bundle size), and deploy to production with full monitoring and observability.

## Story 5.1: Backend Comprehensive Test Coverage

**As a** developer,
**I want** comprehensive test coverage for all backend services,
**so that** I can confidently deploy changes without introducing regressions.

### Acceptance Criteria

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

## Story 5.2: Backend API Performance & Caching

**As a** user,
**I want** fast API response times,
**so that** the app feels snappy and responsive.

### Acceptance Criteria

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

## Story 5.3: MongoDB Atlas Optimization & Data Retention

**As a** developer,
**I want** to optimize MongoDB usage to stay within free tier limits,
**so that** the app remains cost-effective.

### Acceptance Criteria

1. **Database size monitoring:**
   - Script created: `scripts/check_db_size.py` → Reports collection sizes
   - Example: `Contexts: 5MB, Flows: 10MB, Conversations: 15MB, Total: 30MB / 512MB`

2. **Data retention policies implemented:**
   - Completed flows older than 90 days are archived or deleted
   - Conversation history older than 30 days is truncated (keep last 50 messages per context)
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

## Story 5.4: Backend Monitoring & Error Tracking

**As a** developer,
**I want** comprehensive monitoring and error tracking,
**so that** I can quickly identify and resolve production issues.

### Acceptance Criteria

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

## Story 5.5: Frontend Comprehensive Test Coverage

**As a** developer,
**I want** comprehensive test coverage for all frontend components,
**so that** I can confidently make UI changes without breaking existing functionality.

### Acceptance Criteria

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

## Story 5.6: Frontend Bundle Optimization & Code Splitting

**As a** user,
**I want** fast initial page load times,
**so that** the app feels responsive even on slow connections.

### Acceptance Criteria

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

## Story 5.7: Frontend Performance Profiling & Optimization

**As a** user,
**I want** smooth scrolling and interactions,
**so that** the app feels polished and professional.

### Acceptance Criteria

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

## Story 5.8: Frontend Monitoring & Error Tracking

**As a** developer,
**I want** to track frontend errors and performance issues,
**so that** I can improve user experience.

### Acceptance Criteria

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

## Story 5.9: Production Deployment & Smoke Tests

**As a** developer,
**I want** to deploy the app to production with confidence,
**so that** users can access the app reliably.

### Acceptance Criteria

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

## Story 5.10: Monitoring Dashboard & Alerts

**As a** developer,
**I want** a unified monitoring dashboard,
**so that** I can quickly assess system health and respond to issues.

### Acceptance Criteria

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
