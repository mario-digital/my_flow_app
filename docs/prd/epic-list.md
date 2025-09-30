# Epic List

## Epic 1: Foundation, Authentication & Project Setup
**Goal:** Establish project infrastructure, authentication, and deployment pipeline. Deliver a fully functional "Hello World" deployment with authentication flow and health checks. **(Serial: 2-3 days)**

## Epic 2: Context & Flow Data Layer with UI Foundation
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

## Epic 3: AI Conversational Interface & Flow Extraction
**Goal:** Implement AI chat interface with streaming responses and automatic flow extraction from conversation. Users can converse naturally and see flows appear automatically. **(Parallel Work: Backend AI service 3.1-3.4, Frontend chat UI 3.5-3.8)**

**API Contract:**
```
POST   /api/chat/stream           → WebSocket or SSE for AI streaming
POST   /api/chat/extract-flows    → Extract flows from conversation
GET    /api/conversations/{id}    → Get conversation history
```

## Epic 4: Transition Intelligence & Contextual Mock Data
**Goal:** Add smart context transition features (summaries, suggestions, incomplete flow warnings). Populate app with realistic mock data for demo purposes. **(Parallel Work: Backend transition logic 4.1-4.3, Frontend transition UI 4.4-4.6, Mock data 4.7)**

**API Contract:**
```
GET    /api/contexts/{id}/summary           → Context summary
GET    /api/transitions/suggestions         → Transition suggestions
POST   /api/mock-data/generate              → Generate mock data
```

## Epic 5: Comprehensive Testing, Performance Optimization & Production Deployment
**Goal:** Achieve full test coverage, optimize performance (caching, query optimization, bundle size), and deploy to production with monitoring. **(Parallel Work: Backend testing/perf 5.1-5.4, Frontend testing/perf 5.5-5.8, Deployment 5.9-5.10)**

---
