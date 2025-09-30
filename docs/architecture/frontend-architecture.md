# Frontend Architecture

This section provides Next.js 15-specific architecture details, focusing on React Server Components, client-side state management, and CSS design token implementation.

## Component Organization

```
my_flow_client/src/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout (Server Component)
│   ├── page.tsx                 # Home page (Server Component)
│   ├── globals.css              # CSS Design Tokens + Tailwind
│   ├── (auth)/                  # Route group for auth pages
│   │   ├── login/
│   │   │   └── page.tsx         # Login page (Logto redirect)
│   │   └── callback/
│   │       └── page.tsx         # OAuth callback handler
│   └── contexts/                # Context-aware routes
│       └── [context_id]/
│           ├── page.tsx         # Context detail view (Server)
│           └── flows/
│               ├── page.tsx     # Flow list (Server)
│               └── [flow_id]/
│                   └── page.tsx # Flow detail (Server + Client islands)
│
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── calendar.tsx
│   │   └── ... (other shadcn components)
│   ├── context-switcher.tsx    # Client Component
│   ├── context-provider.tsx     # React Context wrapper (Client)
│   └── flows/
│       ├── flow-list.tsx        # Server Component
│       ├── flow-list-interactive.tsx  # Client Component
│       ├── flow-card.tsx        # Server Component
│       └── flow-edit-form.tsx   # Client Component
│
├── lib/                         # Utilities and configs
│   ├── api-client.ts           # Fetch wrapper with auth
│   ├── query-client.ts         # TanStack Query config
│   ├── utils.ts                # Helper functions (cn, date formatting)
│   └── logto.ts                # Logto SDK configuration
│
├── hooks/                       # Custom React hooks
│   ├── use-contexts.ts         # TanStack Query hook for contexts
│   ├── use-flows.ts            # TanStack Query hook for flows
│   ├── use-current-context.ts  # React Context hook for active context
│   └── use-preferences.ts      # TanStack Query hook for preferences
│
├── styles/
│   └── tokens.css              # CSS Custom Properties (Design Tokens)
│
└── types/                       # TypeScript type definitions
    ├── api.ts                  # API request/response types
    └── models.ts               # Data model interfaces (Context, Flow, etc.)
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

**Example: Flow List (Hybrid Pattern)**

```typescript
// flow-list.tsx (Server Component)
import { apiClient } from '@/lib/api-client';
import { FlowListInteractive } from './flow-list-interactive';

interface FlowListProps {
  contextId: string;
}

export async function FlowList({ contextId }: FlowListProps) {
  // Server-side data fetching (no client JS needed)
  const flows = await apiClient.get<Flow[]>(`/api/v1/contexts/${contextId}/flows`);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Flows</h2>
      {/* Pass server-fetched data to client component */}
      <FlowListInteractive initialFlows={flows} contextId={contextId} />
    </div>
  );
}
```

```typescript
// flow-list-interactive.tsx (Client Component)
'use client';

import { useFlows } from '@/hooks/use-flows';
import { FlowCard } from './flow-card';

interface FlowListInteractiveProps {
  initialFlows: Flow[];
  contextId: string;
}

export function FlowListInteractive({ initialFlows, contextId }: FlowListInteractiveProps) {
  // Client-side query with server data as initial state
  const { data: flows, isLoading } = useFlows(contextId, { initialData: initialFlows });

  return (
    <div className="space-y-2">
      {flows?.map((flow) => (
        <FlowCard key={flow.id} flow={flow} />
      ))}
    </div>
  );
}
```

## State Management Architecture

**Two-Layer State Strategy:**

### 1. Server State (TanStack Query)

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

**Token Definition (styles/tokens.css):**
```css
:root {
  /* Base Color Palette */
  --color-background: #0a0a0a;
  --color-foreground: #fafafa;
  --color-muted: #27272a;
  --color-border: #3f3f46;

  /* Context Accent Colors (Static Definitions) */
  --color-accent-work: #3b82f6;
  --color-accent-personal: #10b981;
  --color-accent-rest: #8b5cf6;
  --color-accent-social: #f59e0b;

  /* Dynamic Current Context Color (Set by JavaScript) */
  --color-accent-current: var(--color-accent-work); /* Default */

  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

**Tailwind Configuration (tailwind.config.ts):**
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        accent: {
          work: 'var(--color-accent-work)',
          personal: 'var(--color-accent-personal)',
          rest: 'var(--color-accent-rest)',
          social: 'var(--color-accent-social)',
          current: 'var(--color-accent-current)', // Dynamic!
        },
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Dynamic Context Theming (layout.tsx):**
```typescript
// app/layout.tsx (Server Component)
import { ContextProvider } from '@/components/context-provider';
import { ThemeApplier } from '@/components/theme-applier';
import '@/styles/tokens.css';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ContextProvider>
          <ThemeApplier />
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
```

```typescript
// components/theme-applier.tsx (Client Component)
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

    // Dynamically update CSS custom property
    document.documentElement.style.setProperty('--color-accent-current', context.color);
  }, [currentContextId, contexts]);

  return null; // No visual output, just side effects
}
```

**Usage in Components:**
```tsx
// Any component can use the current context color
<button className="bg-accent-current text-white hover:opacity-90 px-4 py-2 rounded">
  Create Flow
</button>

// Static context colors also available
<div className="border-l-4 border-accent-work pl-4">
  Work context item
</div>
```

## Routing and Navigation

**File-Based Routing (Next.js App Router):**

```
app/
├── page.tsx                     # / (Home - redirects to first context)
├── layout.tsx                   # Root layout with nav
├── (auth)/
│   ├── login/page.tsx          # /login (Logto OAuth start)
│   └── callback/page.tsx       # /callback (Logto OAuth callback)
└── contexts/
    └── [context_id]/
        ├── page.tsx            # /contexts/:id (Context detail)
        └── flows/
            ├── page.tsx        # /contexts/:id/flows (Flow list)
            └── [flow_id]/
                └── page.tsx    # /contexts/:id/flows/:id (Flow detail)
```

**Navigation Component:**
```typescript
// components/nav.tsx (Client Component)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentContext } from './context-provider';

export function Nav() {
  const pathname = usePathname();
  const { currentContextId } = useCurrentContext();

  return (
    <nav className="flex gap-4 border-b border-border px-4 py-3">
      <Link
        href={currentContextId ? `/contexts/${currentContextId}` : '/'}
        className={pathname === '/contexts/[context_id]' ? 'text-accent-current' : ''}
      >
        Overview
      </Link>
      <Link
        href={currentContextId ? `/contexts/${currentContextId}/flows` : '/'}
        className={pathname.includes('/flows') ? 'text-accent-current' : ''}
      >
        Flows
      </Link>
    </nav>
  );
}
```

**Server Action Example (Alternative to API Routes):**
```typescript
// app/actions.ts (Server-side only)
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

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_LOGTO_ENDPOINT: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT,
  },

  // Image domains (if using external images)
  images: {
    domains: ['avatars.githubusercontent.com'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/contexts',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
```

---
