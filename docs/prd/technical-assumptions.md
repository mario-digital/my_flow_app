# Technical Assumptions

## Repository Structure: Monorepo

The project uses a monorepo structure with `/my_flow_api` (FastAPI backend) and `/my_flow_client` (Next.js frontend) as separate packages within a single Git repository. This enables shared tooling, coordinated versioning, and simplified deployment workflows.

## Service Architecture

**Monolithic FastAPI backend** with modular internal structure (routers, services, repositories). The backend is deployed as a single service but organized internally for maintainability and testability. Frontend is a **Next.js 15 App Router** application deployed separately to Vercel.

**Rationale:** Microservices add unnecessary complexity for MVP scale. A well-structured monolith with clear module boundaries provides faster development velocity while maintaining code quality.

## Testing Requirements

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

## Additional Technical Assumptions and Requests

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
