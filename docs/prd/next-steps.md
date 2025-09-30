# Next Steps

## UX Expert Prompt

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

## Architect Prompt

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