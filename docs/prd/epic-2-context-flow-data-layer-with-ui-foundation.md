# Epic 2: Context & Flow Data Layer with UI Foundation

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

## Story 2.1: Context & Flow Pydantic Models with MongoDB Schemas

**As a** backend developer,
**I want** fully typed Pydantic models for Context and Flow entities with MongoDB schema definitions,
**so that** we have strict type safety and validation for all data operations.

### Acceptance Criteria

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

## Story 2.2: Context Repository with CRUD Operations

**As a** backend developer,
**I want** a repository pattern implementation for Context CRUD operations,
**so that** we have a clean separation between data access and business logic.

### Acceptance Criteria

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

## Story 2.3: Flow Repository with CRUD Operations

**As a** backend developer,
**I want** a repository pattern implementation for Flow CRUD operations,
**so that** flows can be managed with proper validation and context association.

### Acceptance Criteria

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

## Story 2.4: Context & Flow REST API Endpoints

**As a** backend developer,
**I want** FastAPI REST endpoints for context and flow management,
**so that** the frontend can perform all CRUD operations via HTTP.

### Acceptance Criteria

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

## Story 2.5: Context Switcher UI Component (shadcn/ui)

**As a** frontend developer,
**I want** a reusable Context Switcher component built with shadcn/ui,
**so that** users can easily switch between contexts with visual distinction.

### Acceptance Criteria

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

## Story 2.6: Flow List UI Component (shadcn/ui)

**As a** frontend developer,
**I want** a Flow List component that displays flows with completion status,
**so that** users can view and manage their flows within a context.

### Acceptance Criteria

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

## Story 2.7: TanStack Query Integration for Contexts API

**As a** frontend developer,
**I want** TanStack Query hooks for context API operations,
**so that** we have optimistic updates, caching, and automatic refetching.

### Acceptance Criteria

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

## Story 2.8: TanStack Query Integration for Flows API

**As a** frontend developer,
**I want** TanStack Query hooks for flow API operations,
**so that** we have optimistic updates, caching, and automatic refetching for flow management.

### Acceptance Criteria

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
