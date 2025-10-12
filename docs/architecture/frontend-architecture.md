# Frontend Architecture

This document provides Next.js 15-specific architecture details for the My Flow application, focusing on React Server Components, authentication patterns, and CSS design token implementation.

## Component Organization

**Current Implementation:**

```
my_flow_client/src/
├── app/                                    # Next.js 15 App Router
│   ├── layout.tsx                         # Root layout with Navigation (Server Component)
│   ├── page.tsx                           # Home page (Server Component)
│   ├── globals.css                        # Tailwind 4.x import + design token layers
│   │
│   ├── styles/tokens/                     # CSS Design Tokens (3-layer architecture)
│   │   ├── colors.css                     # Primitive → Semantic → Component colors
│   │   ├── typography.css                 # Font families, sizes, weights, line heights
│   │   ├── spacing.css                    # Spacing scale (4px base unit)
│   │   ├── effects.css                    # Shadows, borders, radius, z-index
│   │   └── animation.css                  # Transition durations and easings
│   │
│   ├── (auth)/                            # Auth route group (unauthenticated)
│   │   ├── login/
│   │   │   ├── page.tsx                   # Login page (Server Component)
│   │   │   ├── sign-in.tsx                # Sign-in button (Client Component)
│   │   │   └── __tests__/                 # Vitest unit tests
│   │   └── callback/
│   │       ├── page.tsx                   # OAuth callback handler (Server Component)
│   │       └── __tests__/
│   │
│   ├── dashboard/                          # Protected dashboard route
│   │   ├── page.tsx                       # Dashboard page (Server Component)
│   │   └── __tests__/
│   │
│   └── api/
│       └── logto/[...logto]/              # Logto authentication API routes
│           ├── route.ts                   # Dynamic Logto route handler
│           └── __tests__/
│
├── components/                             # Reusable components
│   ├── ui/                                # shadcn/ui primitives
│   │   ├── button.tsx                     # Button component (Client)
│   │   └── __tests__/
│   │
│   ├── navigation.tsx                      # App navigation bar (Server Component)
│   └── __tests__/                         # Component tests
│
├── lib/                                    # Utilities and configs
│   ├── api-client.ts                      # Fetch wrapper (future backend integration)
│   ├── auth.ts                            # Authentication helpers (requireAuth)
│   ├── logto.ts                           # Logto SDK configuration
│   ├── utils.ts                           # Helper functions (cn, etc.)
│   ├── context-theme.ts                   # Context theming utilities (future)
│   ├── ai-context-handler.ts              # AI context management (future)
│   └── __tests__/
│
├── hooks/                                  # Custom React hooks
│   ├── use-context-theme.ts               # Context theme hook (future)
│   └── __tests__/
│
└── types/                                  # TypeScript type definitions
    ├── api.ts                             # API request/response types
    ├── context.ts                         # Context data types (future)
    └── ai-context.ts                      # AI context types (future)
```

**Future Expansion (Story 1.6+):**
```
├── app/contexts/[context_id]/             # Context-specific routes
│   ├── page.tsx                          # Context detail view
│   └── flows/
│       ├── page.tsx                      # Flow list
│       └── [flow_id]/page.tsx           # Flow detail
│
├── components/
│   ├── contexts/
│   │   ├── context-switcher.tsx         # Context switcher (Client)
│   │   └── context-provider.tsx         # React Context wrapper (Client)
│   └── flows/
│       ├── flow-list.tsx                # Server Component
│       ├── flow-list-interactive.tsx    # Client Component
│       ├── flow-card.tsx                # Server Component
│       └── flow-edit-form.tsx           # Client Component
│
└── hooks/
    ├── use-contexts.ts                   # TanStack Query for contexts
    ├── use-flows.ts                      # TanStack Query for flows
    └── use-current-context.ts            # React Context for active context
```

## React Server Components Strategy

**Default to Server Components:**

All components are Server Components by default unless they require:
1. Client-side state (`useState`, `useReducer`)
2. Browser APIs (`window`, `localStorage`, `navigator`)
3. Event handlers (`onClick`, `onChange`)
4. React hooks that depend on client runtime (`useEffect`, `useContext`)

**Server Component Benefits:**
- Zero JavaScript bundle for non-interactive components
- Direct database/API access (no client-side fetch)
- SEO-friendly (fully rendered HTML)
- Improved Time to Interactive (TTI)

**Client Component Indicators:**
- Add `'use client'` directive at top of file
- File name convention: `-interactive.tsx` suffix for clarity
- Keep Client Components small and focused (islands architecture)

**Current Implementation Example: Navigation (Server Component with Server Actions)**

```typescript
// components/navigation.tsx (Server Component)
import Link from 'next/link';
import { getLogtoContext, signOut } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { Button } from '@/components/ui/button';

export async function Navigation() {
  // Server-side auth context fetching (no client JS needed)
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-[var(--color-text-primary)]">
          MyFlow
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {claims?.email}
              </span>
              {/* Server Action for sign-out (no API route needed) */}
              <form action={async () => {
                'use server';
                await signOut(logtoConfig);
              }}>
                <Button variant="outline" type="submit">Sign Out</Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
```

**Current Implementation Example: Protected Dashboard (Server Component)**

```typescript
// app/dashboard/page.tsx (Server Component)
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage() {
  // Server-side authentication check with redirect
  const claims = await requireAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        Dashboard
      </h1>
      <div className="mt-4 rounded-lg border bg-[var(--card-bg)] p-4">
        <p className="text-sm text-[var(--color-text-secondary)]">User ID:</p>
        <p className="font-mono text-[var(--color-text-primary)]">{claims?.sub}</p>
      </div>
    </div>
  );
}
```

**Future Pattern: Flow List (Hybrid Server/Client)**

```typescript
// flow-list.tsx (Server Component - future)
import { apiClient } from '@/lib/api-client';
import { FlowListInteractive } from './flow-list-interactive';

export async function FlowList({ contextId }: { contextId: string }) {
  const flows = await apiClient.get<Flow[]>(`/api/v1/contexts/${contextId}/flows`);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Flows</h2>
      <FlowListInteractive initialFlows={flows} contextId={contextId} />
    </div>
  );
}
```

```typescript
// flow-list-interactive.tsx (Client Component - future)
'use client';

import { useFlows } from '@/hooks/use-flows';
import { FlowCard } from './flow-card';

export function FlowListInteractive({
  initialFlows,
  contextId
}: {
  initialFlows: Flow[];
  contextId: string;
}) {
  const { data: flows } = useFlows(contextId, { initialData: initialFlows });

  return (
    <div className="space-y-2">
      {flows?.map((flow) => <FlowCard key={flow.id} flow={flow} />)}
    </div>
  );
}
```

## State Management Architecture

**Current Implementation Status:**

The application currently uses **Server Components** for all data fetching and state management, eliminating the need for client-side state management libraries in Phase 1. Authentication state is managed server-side via Logto session cookies.

**Future Two-Layer State Strategy (Story 1.6+):**

When interactive features are added (context switching, flow management), the application will adopt a two-layer state management approach:

### 1. Server State (TanStack Query) - Future

**Purpose:** All data from API (contexts, flows, preferences)

**Query Keys Convention:**
```typescript
// hooks/use-contexts.ts
export function useContexts() {
  const { data: user } = useUser(); // From Logto

  return useQuery({
    queryKey: ['contexts', user?.id],
    queryFn: () => apiClient.get<Context[]>('/api/v1/contexts'),
    enabled: !!user,
  });
}

// hooks/use-flows.ts
export function useFlows(contextId: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['flows', contextId],
    queryFn: () => apiClient.get<Flow[]>(`/api/v1/contexts/${contextId}/flows`),
    ...options,
  });
}
```

**Mutation Pattern with Optimistic Updates:**
```typescript
// hooks/use-flows.ts
export function useToggleFlowCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flowId: string) =>
      apiClient.post<Flow>(`/api/v1/flows/${flowId}/complete`, {}),

    // Optimistic update (instant UI feedback)
    onMutate: async (flowId) => {
      await queryClient.cancelQueries({ queryKey: ['flows'] });

      const previousFlows = queryClient.getQueryData<Flow[]>(['flows']);

      queryClient.setQueryData<Flow[]>(['flows'], (old) =>
        old?.map((flow) =>
          flow.id === flowId
            ? { ...flow, is_completed: !flow.is_completed }
            : flow
        )
      );

      return { previousFlows };
    },

    // Rollback on error
    onError: (err, flowId, context) => {
      queryClient.setQueryData(['flows'], context?.previousFlows);
      toast.error('Failed to update flow');
    },

    // Refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
}
```

### 2. Local UI State (React Context)

**Purpose:** Minimal global UI state (current context ID, theme preferences)

**Context Provider:**
```typescript
// components/context-provider.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ContextState {
  currentContextId: string | null;
  setCurrentContextId: (id: string) => void;
}

const CurrentContextContext = createContext<ContextState | undefined>(undefined);

export function ContextProvider({ children }: { children: ReactNode }) {
  const [currentContextId, setCurrentContextId] = useState<string | null>(null);

  return (
    <CurrentContextContext.Provider value={{ currentContextId, setCurrentContextId }}>
      {children}
    </CurrentContextContext.Provider>
  );
}

export function useCurrentContext() {
  const context = useContext(CurrentContextContext);
  if (!context) {
    throw new Error('useCurrentContext must be used within ContextProvider');
  }
  return context;
}
```

**Why Not Redux/Zustand?**

Our app has minimal client state requirements:
- Server state is handled by TanStack Query (caching, refetching, optimistic updates)
- Only local UI state: current context ID (breadcrumb, navigation)
- React Context is sufficient for this single shared value
- Avoids unnecessary complexity and bundle size

## CSS Design Tokens Implementation

**Three-Layer Token Architecture:**

The design system uses a **three-layer token architecture** for maximum flexibility and maintainability:

1. **Layer 1: Primitives** - Raw color values, fixed scales
2. **Layer 2: Semantic** - Purpose-based tokens (e.g., `--color-bg-primary`)
3. **Layer 3: Component-specific** - Component-level tokens (e.g., `--button-bg-primary`)

**Token Organization (app/styles/tokens/):**

```
tokens/
├── colors.css       # 3-layer color system (primitives → semantic → component)
├── typography.css   # Font families, sizes, weights, line heights
├── spacing.css      # Spacing scale (4px base unit)
├── effects.css      # Shadows, borders, radius, z-index
└── animation.css    # Transition durations and easings
```

**Example: colors.css (3-Layer System)**

```css
:root {
  /* ========================================
     LAYER 1: PRIMITIVE COLORS
     ======================================== */

  /* Neutrals */
  --primitive-black-900: #0a0a0a;
  --primitive-black-800: #1a1a1a;
  --primitive-neutral-600: #404040;
  --primitive-white: #fafafa;

  /* Context Colors (with hover states for full browser compatibility) */
  --primitive-work: #3b82f6;
  --primitive-work-hover: #60a5fa;
  --primitive-personal: #f97316;
  --primitive-rest: #a855f7;
  --primitive-social: #10b981;

  /* Semantic Feedback */
  --primitive-success: #22c55e;
  --primitive-warning: #eab308;
  --primitive-error: #ef4444;

  /* ========================================
     LAYER 2: SEMANTIC COLORS
     ======================================== */

  /* Backgrounds */
  --color-bg-primary: var(--primitive-black-900);
  --color-bg-secondary: var(--primitive-black-800);
  --color-bg-tertiary: var(--primitive-black-700);

  /* Text */
  --color-text-primary: var(--primitive-white);
  --color-text-secondary: var(--primitive-neutral-400);
  --color-text-muted: var(--primitive-neutral-500);

  /* Borders */
  --color-border: var(--primitive-neutral-600);
  --color-border-hover: var(--primitive-neutral-500);

  /* Context - Dynamic (controlled via JavaScript) */
  --color-context-current: var(--primitive-work); /* Default to Work */
  --color-context-current-hover: var(--primitive-work-hover);
  --color-context-work: var(--primitive-work);
  --color-context-personal: var(--primitive-personal);
  --color-context-rest: var(--primitive-rest);
  --color-context-social: var(--primitive-social);

  /* ========================================
     LAYER 3: COMPONENT COLORS
     ======================================== */

  /* Buttons */
  --button-bg-primary: var(--color-context-current);
  --button-bg-primary-hover: var(--color-context-current-hover);
  --button-text-primary: var(--primitive-white);

  --button-bg-secondary: transparent;
  --button-border-secondary: var(--color-border);
  --button-text-secondary: var(--color-text-primary);

  /* Cards */
  --card-bg: var(--color-bg-secondary);
  --card-bg-hover: var(--color-bg-tertiary);
  --card-border: var(--color-border);
  --card-border-active: var(--color-context-current);

  /* Input Fields */
  --input-bg: var(--color-bg-secondary);
  --input-border: var(--color-border);
  --input-border-focus: var(--color-context-current);
}
```

**Token Import via @layer (globals.css):**

```css
/* Tailwind CSS v4.x import */
@import 'tailwindcss';

/* Design Tokens - Layer ensures proper import order */
@layer tokens {
  @import './styles/tokens/colors.css' layer(tokens.colors);
  @import './styles/tokens/typography.css' layer(tokens.typography);
  @import './styles/tokens/spacing.css' layer(tokens.spacing);
  @import './styles/tokens/effects.css' layer(tokens.effects);
  @import './styles/tokens/animation.css' layer(tokens.animation);
}

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
}
```

**Tailwind Configuration (tailwind.config.ts):**

The Tailwind configuration maps CSS design tokens to Tailwind utility classes, enabling usage like `bg-bg-primary`, `text-text-secondary`, `border-context`, etc.

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',

        // Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',

        // Borders
        'border': 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',

        // Context (dynamic)
        'context': 'var(--color-context-current)',
        'context-work': 'var(--color-context-work)',
        'context-personal': 'var(--color-context-personal)',
        'context-rest': 'var(--color-context-rest)',
        'context-social': 'var(--color-context-social)',

        // Component-specific
        'button-primary': 'var(--button-bg-primary)',
        'card': 'var(--card-bg)',
        'input': 'var(--input-bg)',
      },

      // Spacing maps to default Tailwind scale + custom tokens
      spacing: {
        '32': 'var(--space-32)', // 128px
        '40': 'var(--space-40)', // 160px
        '48': 'var(--space-48)', // 192px
      },

      // Font configuration
      fontSize: {
        'tiny': 'var(--font-size-tiny)',     // 12px
        'small': 'var(--font-size-small)',   // 14px
        'body': 'var(--font-size-body)',     // 16px
        'h3': 'var(--font-size-h3)',         // 20px
        'h2': 'var(--font-size-h2)',         // 24px
        'h1': 'var(--font-size-h1)',         // 32px
      },

      // Shadows, radius, z-index, animations all mapped similarly
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

export default config
```

**Dynamic Context Theming (Future Implementation):**

When context switching is implemented (Story 1.6+), the following pattern will enable dynamic theming:

```typescript
// components/theme-applier.tsx (Client Component - future)
'use client';

import { useEffect } from 'react';
import { useCurrentContext } from './context-provider';
import { useContexts } from '@/hooks/use-contexts';

export function ThemeApplier() {
  const { currentContextId } = useCurrentContext();
  const { data: contexts } = useContexts();

  useEffect(() => {
    if (!currentContextId || !contexts) return;

    const context = contexts.find((c) => c.id === currentContextId);
    if (!context) return;

    // Dynamically update CSS custom properties for current context
    const root = document.documentElement;
    root.style.setProperty('--color-context-current', context.color);
    root.style.setProperty('--color-context-current-hover', context.colorHover);
  }, [currentContextId, contexts]);

  return null; // No visual output, just side effects
}
```

This approach allows all components using `var(--color-context-current)` to automatically update when the context changes, without prop drilling or context API complexity.

**Usage in Components (CSS Custom Properties):**

The design token approach allows direct usage of CSS custom properties via Tailwind utility classes or direct CSS variable references:

```tsx
// Current implementation - direct CSS variable usage
<div className="border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
  <span className="text-[var(--color-text-primary)]">Content</span>
</div>

// Future - Tailwind utility mapping (cleaner syntax)
<button className="bg-context text-white hover:opacity-90 px-4 py-2 rounded">
  Create Flow
</button>

// Static context colors always available
<div className="border-l-4 border-context-work pl-4">
  Work context item
</div>
```

**Benefits of this approach:**
- Single source of truth for all design values
- Runtime theme switching without React re-renders
- Framework-agnostic (works with any UI library)
- AI agents can modify tokens without touching component code
- Design system evolution doesn't require component updates

## Routing and Navigation

**File-Based Routing (Next.js App Router):**

**Current Routes:**
```
app/
├── page.tsx                      # / (Home page)
├── layout.tsx                    # Root layout with Navigation component
├── (auth)/                       # Auth route group (unauthenticated layout)
│   ├── login/page.tsx           # /login (Logto sign-in)
│   └── callback/page.tsx        # /callback (OAuth callback handler)
├── dashboard/page.tsx            # /dashboard (Protected, requires auth)
└── api/
    └── logto/[...logto]/        # /api/logto/* (Logto API routes)
        └── route.ts             # Dynamic Logto route handler
```

**Future Routes (Story 1.6+):**
```
app/
└── contexts/
    └── [context_id]/
        ├── page.tsx            # /contexts/:id (Context overview)
        └── flows/
            ├── page.tsx        # /contexts/:id/flows (Flow list)
            └── [flow_id]/
                └── page.tsx    # /contexts/:id/flows/:id (Flow detail)
```

**Authentication & Navigation Pattern:**

The application uses **Server Components** for navigation with Logto's server-side authentication:

```typescript
// components/navigation.tsx (Current Implementation - Server Component)
import Link from 'next/link';
import { getLogtoContext, signOut } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { Button } from '@/components/ui/button';

export async function Navigation() {
  // Server-side authentication check (no client JS needed)
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  return (
    <nav className="border-b border-[var(--color-border)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">MyFlow</Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {claims?.email}
              </span>
              <form action={async () => {
                'use server';
                await signOut(logtoConfig);
              }}>
                <Button variant="outline" type="submit">Sign Out</Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
```

**Protected Route Pattern:**

```typescript
// lib/auth.ts (Authentication helper)
import { redirect } from 'next/navigation';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from './logto';

export async function requireAuth() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect('/login');
  }

  return claims;
}
```

**Server Action Pattern (Current Implementation):**

Server Actions are used for mutations (sign-out) without needing dedicated API routes:

```typescript
// Example: Sign-out action embedded in Navigation component
<form action={async () => {
  'use server';
  await signOut(logtoConfig);
}}>
  <Button type="submit">Sign Out</Button>
</form>
```

## API Authentication & BFF Proxy Pattern

**Critical Architecture Rule:** Browser code NEVER calls FastAPI directly. All API requests go through **Next.js API routes** which act as a **Backend-for-Frontend (BFF) proxy**.

### Why BFF Pattern?

1. **Security:** JWT tokens never exposed to browser (only HttpOnly session cookies)
2. **Simplicity:** No token refresh logic in browser code
3. **Flexibility:** Backend URL changes don't affect frontend
4. **CORS:** Single-origin requests eliminate CORS complexity

### Authentication Flow (BFF Pattern)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Browser   │         │  Next.js Server  │         │   FastAPI   │
│             │         │      (BFF)       │         │  (Backend)  │
└─────────────┘         └──────────────────┘         └─────────────┘
       │                         │                          │
       │ 1. fetch('/api/flows') │                          │
       │    (session cookie)     │                          │
       │────────────────────────>│                          │
       │                         │                          │
       │                         │ 2. getApiAccessToken()   │
       │                         │    (calls Logto SDK)     │
       │                         │<─ JWT token              │
       │                         │                          │
       │                         │ 3. fetch(FastAPI + JWT)  │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │ 4. JSON response         │
       │                         │<─────────────────────────│
       │                         │                          │
       │ 5. JSON response        │                          │
       │<────────────────────────│                          │
       │   (no token!)           │                          │
```

### Browser-Side API Calls

**Rule:** Browser code calls Next.js API routes (starting with `/api/`), NEVER FastAPI directly.

```typescript
// ❌ WRONG: Direct call to FastAPI with JWT
const response = await fetch('https://api.myflow.com/api/v1/flows', {
  headers: { Authorization: `Bearer ${token}` } // Token exposed!
});

// ❌ WRONG: Trying to get token in browser
const token = await getAccessToken(); // Token exposed!

// ✅ CORRECT: Call Next.js API route (BFF proxy)
const response = await fetch('/api/flows'); // Next.js route
const flows = await response.json();
```

### Next.js API Route (BFF Proxy Implementation)

```typescript
// app/api/flows/route.ts
import { getApiAccessToken } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL; // FastAPI URL

export async function GET() {
  try {
    // 1. Get JWT token server-side (never exposed to browser)
    const token = await getApiAccessToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Call FastAPI with JWT token
    const response = await fetch(`${API_BASE_URL}/api/v1/flows`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }
    
    // 3. Proxy response back to browser (without token)
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### SSE Streaming Through BFF Proxy

**For AI chat streaming, the BFF pattern is critical** to prevent token exposure during long-lived connections:

```typescript
// app/api/chat/stream/route.ts
import { getApiAccessToken } from '@logto/next/server-actions';

export async function POST(request: Request) {
  const body = await request.json();
  
  // 1. Get JWT server-side
  const token = await getApiAccessToken();
  
  // 2. Stream from FastAPI with JWT
  const upstreamResponse = await fetch(
    `${process.env.API_BASE_URL}/api/v1/conversations/stream`,
    {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  
  // 3. Pipe SSE stream back to browser (token never exposed)
  const { readable, writable } = new TransformStream<Uint8Array>();
  upstreamResponse.body!.pipeTo(writable);
  
  return new Response(readable, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Browser-side SSE consumption:**

```typescript
// Browser code - connects to Next.js proxy, not FastAPI
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ context_id, messages }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process SSE events
}
```

### API Route File Organization

```
app/api/
├── flows/
│   ├── route.ts                 # GET/POST /api/flows
│   └── [id]/
│       ├── route.ts             # GET/PUT/DELETE /api/flows/:id
│       └── complete/
│           └── route.ts         # PATCH /api/flows/:id/complete
├── contexts/
│   ├── route.ts                 # GET/POST /api/contexts
│   └── [id]/
│       ├── route.ts             # GET/PUT/DELETE /api/contexts/:id
│       └── flows/
│           └── route.ts         # GET /api/contexts/:id/flows
├── chat/
│   └── stream/
│       └── route.ts             # POST /api/chat/stream (SSE)
└── logto/
    └── [...logto]/
        └── route.ts             # Logto OAuth routes
```

### Key Security Benefits

1. **Token Isolation:** JWT tokens exist ONLY on Next.js server, never in browser
2. **Session Cookie:** Browser uses HttpOnly, Secure, SameSite=Lax session cookie
3. **Token Refresh:** Logto SDK handles token lifecycle server-side
4. **CSRF Protection:** SameSite cookie attribute prevents CSRF attacks
5. **No CORS:** All browser requests to same origin (Next.js)

**Future Server Actions (Story 1.6+):**

```typescript
// app/actions.ts (Future implementation)
'use server';

import { apiClient } from '@/lib/api-client';
import { revalidatePath } from 'next/cache';

export async function createFlow(formData: FormData) {
  const contextId = formData.get('context_id') as string;
  const title = formData.get('title') as string;

  await apiClient.post('/api/v1/flows', {
    context_id: contextId,
    title,
  });

  // Revalidate the cache for this page
  revalidatePath(`/contexts/${contextId}/flows`);
}
```

## Performance Optimizations

**1. Server Component Data Fetching (Parallel):**
```typescript
// app/contexts/[context_id]/page.tsx
export default async function ContextPage({ params }: { params: { context_id: string } }) {
  // Parallel data fetching (no waterfall)
  const [context, flows, stats] = await Promise.all([
    apiClient.get<Context>(`/api/v1/contexts/${params.context_id}`),
    apiClient.get<Flow[]>(`/api/v1/contexts/${params.context_id}/flows`),
    apiClient.get<Stats>(`/api/v1/contexts/${params.context_id}/stats`),
  ]);

  return (
    <div>
      <ContextHeader context={context} stats={stats} />
      <FlowList initialFlows={flows} contextId={params.context_id} />
    </div>
  );
}
```

**2. Image Optimization (Next.js Image):**
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="My Flow Logo"
  width={200}
  height={50}
  priority // Load immediately for above-the-fold images
/>
```

**3. Code Splitting (Dynamic Imports):**
```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components (e.g., Markdown editor)
const MarkdownEditor = dynamic(() => import('@/components/markdown-editor'), {
  loading: () => <p>Loading editor...</p>,
  ssr: false, // Client-side only
});
```

**4. Prefetching Links:**
```tsx
// Next.js automatically prefetches links on hover
<Link href="/contexts/123" prefetch={true}>
  View Context
</Link>
```

## Error Handling and Loading States

**Error Boundary (error.tsx):**
```typescript
// app/contexts/[context_id]/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-red-500">Something went wrong!</h2>
      <p className="text-muted">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-accent-current text-white rounded">
        Try again
      </button>
    </div>
  );
}
```

**Loading State (loading.tsx):**
```typescript
// app/contexts/[context_id]/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-32 bg-muted rounded" />
      <div className="h-32 bg-muted rounded" />
    </div>
  );
}
```

## Accessibility Considerations

**Focus Management:**
```typescript
// Auto-focus on modal open
import { useEffect, useRef } from 'react';

export function Dialog({ isOpen }: { isOpen: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  return <div ref={dialogRef} tabIndex={-1} role="dialog" />;
}
```

**Semantic HTML:**
```tsx
<main className="container mx-auto p-4">
  <h1 className="sr-only">Flow Management</h1>
  <nav aria-label="Context navigation">
    {/* Navigation links */}
  </nav>
  <article aria-labelledby="flow-title">
    <h2 id="flow-title">Flow Title</h2>
    {/* Flow content */}
  </article>
</main>
```

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Context switcher: Arrow keys to navigate, Enter to select
- Flow list: J/K for up/down navigation (vim-style, optional)

## Frontend Build Configuration

**Current Configuration:**

```typescript
// next.config.ts (Current implementation - minimal config)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Intentionally minimal - Next.js 15 defaults are production-ready */
};

export default nextConfig;
```

**Key Build Features:**
- **Turbopack**: Enabled in development via `--turbopack` flag (3x faster than Webpack)
- **React 19**: Using latest stable React with improved Server Components
- **TypeScript 5.x**: Strict mode enabled for type safety
- **Tailwind CSS 4.x**: Native CSS v4 with improved performance
- **Bun**: Package manager and test runner (faster than npm/yarn)

**Development Scripts:**

```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "lint": "eslint . --max-warnings=0",
  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
  "typecheck": "tsc --noEmit"
}
```

**Environment Variables:**

All secrets are managed via **1Password CLI** with references in `.env.template`:

```bash
# Frontend environment variables (managed by 1Password)
NEXT_PUBLIC_API_URL="op://MyFlow Development/MyFlow Backend/api_url"
NEXT_PUBLIC_LOGTO_ENDPOINT="op://MyFlow Development/MyFlow Logto Frontend/endpoint"
NEXT_PUBLIC_LOGTO_APP_ID="op://MyFlow Development/MyFlow Logto Frontend/app_id"
LOGTO_APP_SECRET="op://MyFlow Development/MyFlow Logto Frontend/app_secret"
LOGTO_COOKIE_SECRET="op://MyFlow Development/MyFlow Logto Frontend/cookie_secret"
```

**Testing Configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.tsx'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---
