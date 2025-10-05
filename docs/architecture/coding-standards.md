# 14. Coding Standards

## Critical Fullstack Rules

These standards prevent common mistakes and ensure consistency across AI-generated code:

### 1. **Type Sharing Pattern**

**Rule:** All shared types between frontend and backend MUST be defined in a single source of truth.

```typescript
// ❌ WRONG: Duplicate type definitions
// frontend: src/types/flow.ts
type Flow = { id: string; title: string; }

// backend: src/models/flow.py
class Flow(BaseModel):
    id: str
    title: str

// ✅ CORRECT: Backend defines types, frontend imports from OpenAPI
// backend: src/models/flow.py
class Flow(BaseModel):
    id: str
    title: str
    priority: FlowPriority

// frontend: src/types/api.ts (generated from OpenAPI)
import type { components } from './openapi-schema';
export type Flow = components['schemas']['Flow'];
```

**Rationale:** Single source prevents drift. Backend is source of truth because Pydantic validates at runtime.

### 2. **API Call Conventions**

**Rule:** All API calls MUST go through centralized API client with consistent error handling.

```typescript
// ❌ WRONG: Direct fetch calls
const response = await fetch('/api/flows');
const flows = await response.json();

// ✅ CORRECT: Use centralized apiClient
import { apiClient } from '@/lib/api-client';
const flows = await apiClient.get<Flow[]>('/api/v1/flows');
```

**Why:** Centralized client handles auth headers, base URL, error transformation, and retry logic.

### 3. **Environment Variable Access**

**Rule:** NEVER access `process.env` directly in components. Use centralized config.

```typescript
// ❌ WRONG: Direct access
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ CORRECT: Use config module
import { config } from '@/lib/config';
const apiUrl = config.apiUrl;
```

**Backend equivalent:**

```python
# ❌ WRONG: Direct os.environ access
import os
db_url = os.environ['MONGODB_URI']

# ✅ CORRECT: Use Pydantic settings
from src.config import settings
db_url = settings.MONGODB_URI
```

### 4. **State Update Patterns**

**Rule:** Server state updates MUST use optimistic updates for <500ms perceived latency.

```typescript
// ❌ WRONG: Pessimistic update (slow UX)
const { mutate } = useMutation({
  mutationFn: (flowId: string) => apiClient.patch(`/flows/${flowId}`, { is_completed: true }),
});

// ✅ CORRECT: Optimistic update
const { mutate } = useMutation({
  mutationFn: (flowId: string) => apiClient.patch(`/flows/${flowId}`, { is_completed: true }),
  onMutate: async (flowId) => {
    await queryClient.cancelQueries({ queryKey: ['flows'] });
    const previous = queryClient.getQueryData<Flow[]>(['flows']);
    queryClient.setQueryData<Flow[]>(['flows'], (old) =>
      old?.map((f) => (f.id === flowId ? { ...f, is_completed: true } : f))
    );
    return { previous };
  },
  onError: (_err, _flowId, context) => {
    queryClient.setQueryData(['flows'], context?.previous);
  },
});
```

### 5. **Error Handling Standards**

**Rule:** All errors MUST be transformed to `AppError` with user-friendly messages.

**Frontend:**

```typescript
// ❌ WRONG: Exposing raw errors to users
catch (error) {
  toast.error(error.message); // "Network request failed"
}

// ✅ CORRECT: Transform to user-friendly message
catch (error) {
  const appError = transformError(error);
  toast.error(appError.userMessage); // "Failed to create flow. Please try again."
}
```

**Backend:**

```python
# ❌ WRONG: Leaking internal errors
raise ValueError("User not found in database")

# ✅ CORRECT: Use HTTPException with safe message
raise HTTPException(status_code=404, detail="User not found")
```

### 6. **Server Component Rules**

**Rule:** Server Components MUST NOT import client-only hooks or state.

```typescript
// ❌ WRONG: Using useState in Server Component
export default function FlowList() {
  const [flows, setFlows] = useState([]); // ERROR!
  return <div>{flows.map(...)}</div>;
}

// ✅ CORRECT: Server fetches data, Client handles interactivity
// flow-list.tsx (Server Component)
export default async function FlowList() {
  const flows = await fetchFlows();
  return <FlowListInteractive initialFlows={flows} />;
}

// flow-list-interactive.tsx (Client Component)
'use client';
export function FlowListInteractive({ initialFlows }) {
  const { data } = useFlows({ initialData: initialFlows });
  return <div>{data?.map(...)}</div>;
}
```

### 7. **Database Query Patterns**

**Rule:** All MongoDB queries MUST use repository pattern with proper error handling.

```python
# ❌ WRONG: Direct collection access in routes
@router.get("/flows")
async def get_flows():
    flows = await db.flows.find().to_list(100)
    return flows

# ✅ CORRECT: Use repository + service layer
@router.get("/flows")
async def get_flows(
    flow_service: FlowService = Depends(get_flow_service),
    user_id: str = Depends(get_current_user)
):
    return await flow_service.get_flows_for_user(user_id)
```

## Naming Conventions

| Element                  | Convention    | Frontend Example              | Backend Example            |
|--------------------------|---------------|-------------------------------|----------------------------|
| React Components         | PascalCase    | `FlowCard.tsx`                | N/A                        |
| React Hooks              | camelCase     | `useFlows.ts`                 | N/A                        |
| Client Components        | kebab-case    | `flow-list-interactive.tsx`   | N/A                        |
| Server Components        | kebab-case    | `flow-list.tsx`               | N/A                        |
| API Routes (Next.js)     | kebab-case    | `app/api/flows/route.ts`      | N/A                        |
| API Endpoints (FastAPI)  | snake_case    | N/A                           | `@router.get("/user_preferences")` |
| Python Classes           | PascalCase    | N/A                           | `FlowService`              |
| Python Functions         | snake_case    | N/A                           | `def get_flows_by_context()` |
| Database Collections     | snake_case    | N/A                           | `contexts`, `flows`, `user_preferences` |
| MongoDB Fields           | snake_case    | N/A                           | `created_at`, `due_date`, `reminder_enabled` |
| TypeScript Interfaces    | PascalCase    | `interface FlowCardProps {}`  | N/A                        |
| TypeScript Types         | PascalCase    | `type FlowStatus = ...`       | N/A                        |
| CSS Custom Properties    | kebab-case    | `--color-accent-work`         | N/A                        |
| Tailwind Classes         | kebab-case    | `bg-accent-work`              | N/A                        |
| Environment Variables    | UPPER_SNAKE   | `NEXT_PUBLIC_API_URL`         | `MONGODB_URI`              |
| Constants                | UPPER_SNAKE   | `const MAX_FLOWS = 100`       | `MAX_FLOWS = 100`          |

## File Organization Rules

**Frontend:**

```
src/
├── app/                 # Next.js App Router pages (kebab-case)
│   ├── (auth)/login/page.tsx
│   └── contexts/[id]/page.tsx
├── components/          # React components (PascalCase for files)
│   ├── ui/              # shadcn/ui components
│   │   └── Button.tsx
│   └── flow-card.tsx    # Custom components (kebab-case)
├── hooks/               # Custom hooks (camelCase)
│   └── useFlows.ts
├── lib/                 # Utilities and configuration
│   ├── api-client.ts
│   └── utils.ts
└── types/               # TypeScript types
    └── api.ts
```

**Backend:**

```
src/
├── main.py              # FastAPI app entry point
├── config.py            # Pydantic settings
├── models/              # Pydantic models (snake_case files)
│   ├── flow.py
│   └── context.py
├── repositories/        # Data access layer
│   ├── base.py
│   └── flow_repository.py
├── services/            # Business logic layer
│   └── flow_service.py
├── routers/             # FastAPI route handlers
│   └── flows.py
└── middleware/          # Custom middleware
    └── auth.py
```

## Import Order Standards

**Frontend (TypeScript):**

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports (@/ alias)
import { Button } from '@/components/ui/button';
import { useFlows } from '@/hooks/useFlows';
import type { Flow } from '@/types/api';

// 3. Relative imports
import { FlowCard } from './flow-card';

// 4. Styles (if any)
import './styles.css';
```

**Backend (Python):**

```python
# 1. Standard library imports
from datetime import datetime
from typing import List, Optional

# 2. Third-party imports
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# 3. Local application imports
from src.models.flow import Flow, FlowCreate
from src.repositories.flow_repository import FlowRepository
from src.services.flow_service import FlowService
from src.middleware.auth import get_current_user
```

## Design Decisions

1. **Backend as Source of Truth for Types:** Pydantic models validate at runtime, preventing invalid data from entering the system. Frontend generates types from OpenAPI spec.

2. **Centralized API Client:** Single point of failure/success for all HTTP requests. Easier to add logging, monitoring, and error handling uniformly.

3. **Repository Pattern in Backend:** Separates data access from business logic. Makes it easier to mock database in tests and swap implementations.

4. **Optimistic Updates:** Dramatically improves perceived performance (<500ms vs 1-2s). Users see instant feedback while server processes request.

5. **Server Component Default:** Reduces JavaScript bundle size and improves initial page load. Only use client components when interactivity is needed.

6. **Environment Variable Abstraction:** Prevents runtime errors from typos in `process.env` keys. Centralizes configuration with validation.

7. **Consistent Naming Conventions:** Reduces cognitive load for AI agents. `snake_case` for Python/DB, `camelCase` for JS functions, `PascalCase` for classes/components.

8. **CSS Design Tokens System:** All colors, spacing, typography, and effects use CSS custom properties in a 3-layer hierarchy (Primitive → Semantic → Component). This ensures consistent theming, enables dynamic context switching, and prevents hardcoded values. **CRITICAL:** Never add new tokens without UX approval. See [`docs/ux-design-tokens/css-tokens-usage.md`](../ux-design-tokens/css-tokens-usage.md) for complete usage guide.

---
