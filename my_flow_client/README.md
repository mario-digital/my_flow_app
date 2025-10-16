# MyFlow Frontend

**Next.js 15 + React 19** frontend application with Server-First architecture, AI-powered chat, and context-based flow management.

---

## 🎯 Quick Links

- [Tech Stack](#tech-stack)
- [Authentication](#authentication-logto-bff-pattern)
- [Architecture](#architecture)
- [Design System & Theming](#design-system--theming)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Code Quality](#code-quality)

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 15.x | App Router, RSC, Server Actions |
| **React** | React | 19.x | UI library with concurrent features |
| **Language** | TypeScript | 5.6+ | Strict mode, type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first with design tokens |
| **UI Components** | shadcn/ui | latest | Accessible Radix UI primitives |
| **State Management** | TanStack Query | v5 | Server state, caching, optimistic updates |
| **State (Local)** | React Context | - | Minimal local UI state |
| **Notifications** | Sonner | latest | Toast notifications |
| **Testing (Unit)** | Vitest | latest | Fast unit tests |
| **Testing (E2E)** | Playwright | latest | End-to-end tests |
| **Linting** | ESLint | v9 | Code quality |
| **Formatting** | Prettier | latest | Code formatting |
| **Package Manager** | Bun | 1.x | Fast package manager |

---

## Authentication (Logto + BFF Pattern)

### Overview

MyFlow uses **Logto** for OAuth 2.0 + JWT authentication with a **Backend-for-Frontend (BFF)** pattern to ensure JWT tokens **never** reach the browser.

### Security Model

```
Browser ──────► Next.js Server ──────► FastAPI Backend
         (cookies)          (JWT token)
```

- **Client → Next.js**: Uses HttpOnly cookies (no tokens in browser)
- **Next.js → FastAPI**: Uses JWT tokens server-side only
- **JWT Tokens**: Obtained and managed exclusively on the server

### Frontend Auth Implementation

#### 1. Logto Configuration

**File:** `src/lib/logto.ts`

```typescript
import { LogtoNextConfig } from '@logto/next';

export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  baseUrl: 'http://localhost:3000',
  cookieSecure: process.env.NODE_ENV === 'production',
  resources: [process.env.NEXT_PUBLIC_LOGTO_RESOURCE!],
};
```

**Key Points:**
- Cookies are HttpOnly and Secure in production
- `resources` array allows API access token retrieval
- All secrets stay server-side

#### 2. Protected Routes

**File:** `src/lib/auth.ts`

```typescript
import { redirect } from 'next/navigation';
import { getLogtoContext } from '@logto/next/server-actions';

export async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  
  if (!isAuthenticated) {
    redirect('/login');
  }
}
```

**Usage in Server Components:**

```typescript
// app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage() {
  await requireAuth(); // Redirects if not authenticated
  
  return <DashboardContent />;
}
```

#### 3. BFF API Routes (Token Proxy)

**File:** `app/api/flows/route.ts`

```typescript
import { getApiAccessToken } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL; // FastAPI URL

export async function GET() {
  try {
    // 1. Get JWT token server-side
    const token = await getApiAccessToken();
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Call FastAPI with JWT token
    const response = await fetch(`${API_BASE_URL}/api/v1/flows`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    // 3. Proxy response to browser (without token)
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch flows' },
      { status: 500 }
    );
  }
}
```

**Key Security Features:**
- ✅ JWT token obtained server-side only (`getApiAccessToken`)
- ✅ Token forwarded to FastAPI in Authorization header
- ✅ Response proxied back to browser without token
- ✅ Browser never sees JWT token

#### 4. Server Actions for Auth

**File:** `src/lib/actions/auth.ts`

```typescript
'use server';

import { redirect } from 'next/navigation';
import { signOut as logtoSignOut } from '@logto/next/server-actions';

export async function signOut() {
  await logtoSignOut(logtoConfig);
  redirect('/');
}
```

**Usage in Client Components:**

```typescript
'use client';

import { signOut } from '@/lib/actions/auth';

export function Navigation() {
  return (
    <form action={signOut}>
      <button type="submit">Sign Out</button>
    </form>
  );
}
```

### Authentication Flow Diagram

```
1. User clicks "Sign In"
   ↓
2. Redirect to Logto hosted login
   ↓
3. User authenticates with Logto
   ↓
4. Logto redirects back to /callback
   ↓
5. Next.js SDK stores session in HttpOnly cookie
   ↓
6. User navigated to /dashboard
   ↓
7. Browser requests data from Next.js BFF routes
   ↓
8. Next.js obtains JWT token server-side
   ↓
9. Next.js calls FastAPI with JWT token
   ↓
10. FastAPI validates JWT and returns data
    ↓
11. Next.js proxies data to browser
```

**Critical Security Points:**
- 🔒 JWT tokens **never** exposed to browser JavaScript
- 🔒 Cookies are HttpOnly (not accessible to JS)
- 🔒 All API calls go through Next.js BFF proxy
- 🔒 FastAPI validates JWT on every request

---

## Architecture

### Server-First Rendering Strategy

MyFlow uses React 19 Server Components as the **default**, with Client Components only when necessary.

**Breakdown:**
- **~90% Server Components** - Most pages, layouts, and data-fetching components
- **~10% Client Components** - Interactive UI (forms, modals, chat interface)

**Benefits:**
- ✅ **90% smaller JavaScript bundle** - Most components render on server
- ✅ **Faster TTI** (Time to Interactive) - Less JS to parse
- ✅ **Better SEO** - Server-rendered HTML
- ✅ **Secure** - API keys and sensitive logic stay on server

**Example:**

```typescript
// ✅ Server Component (default - no 'use client')
// app/dashboard/page.tsx
import { getFlows } from '@/lib/api/flows';

export default async function DashboardPage() {
  const flows = await getFlows(); // Fetch on server
  
  return (
    <div>
      <FlowList flows={flows} /> {/* Server Component */}
      <ChatInterface /> {/* Client Component (needs interactivity) */}
    </div>
  );
}
```

```typescript
// ✅ Client Component (when needed)
// components/chat/chat-interface.tsx
'use client';

import { useState } from 'react';
import { useChatStream } from '@/hooks/use-chat-stream';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const { sendMessage } = useChatStream();
  
  return (
    <form onSubmit={() => sendMessage(message)}>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
}
```

### State Management Strategy

**Two-Layer Approach:**

#### 1. Server State (TanStack Query)

For all API data (contexts, flows, conversations):

```typescript
// hooks/use-flows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFlows, createFlow } from '@/lib/api/flows';

export function useFlows(contextId: string) {
  return useQuery({
    queryKey: ['flows', contextId],
    queryFn: () => getFlows(contextId),
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createFlow,
    // Optimistic update
    onMutate: async (newFlow) => {
      await queryClient.cancelQueries({ queryKey: ['flows'] });
      
      const previousFlows = queryClient.getQueryData(['flows', newFlow.context_id]);
      
      queryClient.setQueryData(['flows', newFlow.context_id], (old) => 
        [...(old || []), { ...newFlow, id: 'temp' }]
      );
      
      return { previousFlows };
    },
    // Rollback on error
    onError: (err, newFlow, context) => {
      queryClient.setQueryData(
        ['flows', newFlow.context_id],
        context.previousFlows
      );
    },
    // Refetch on success
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flows', variables.context_id] });
    },
  });
}
```

**Features:**
- ✅ Automatic caching and background refetching
- ✅ Optimistic updates for instant UI feedback
- ✅ Automatic rollback on errors
- ✅ Query invalidation and refetching

#### 2. Local UI State (React Context)

For minimal local state (current context selection, theme):

```typescript
// components/providers/app-providers.tsx
'use client';

import { createContext, useContext, useState } from 'react';

const CurrentContextContext = createContext<{
  currentContextId: string | null;
  setCurrentContextId: (id: string | null) => void;
}>(null!);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [currentContextId, setCurrentContextId] = useState<string | null>(null);
  
  return (
    <CurrentContextContext.Provider value={{ currentContextId, setCurrentContextId }}>
      {children}
    </CurrentContextContext.Provider>
  );
}

export function useCurrentContext() {
  return useContext(CurrentContextContext);
}
```

**When to Use Which:**
- **TanStack Query**: API data, server state, anything that needs caching
- **React Context**: UI state, local preferences, non-persisted state

### CSS Design Tokens System

MyFlow uses a **3-layer CSS Design Token architecture** (primitives → semantic → component) for consistent theming and dynamic context switching.

**📖 Complete Guide:** See the dedicated [Design System & Theming](#design-system--theming) section below for full details on all token layers, runtime theming, and usage examples.

---

## Design System & Theming

MyFlow uses a comprehensive **3-layer CSS Design Token system** for consistent theming and dynamic context switching.

### CSS Design Token Files

```
src/app/styles/tokens/
├── colors.css        # 3-layer color system (primitives → semantic → component)
├── typography.css    # Font families, sizes, weights, line heights
├── spacing.css       # Spacing scale (4px base unit)
├── effects.css       # Shadows, borders, radius, z-index
└── animation.css     # Transition durations and easings
```

### Color Token Layers

#### Layer 1: Primitives (Raw values, never change at runtime)

```css
/* src/app/styles/tokens/colors.css */
:root {
  /* Context Colors */
  --primitive-work: #3b82f6;
  --primitive-personal: #f97316;
  --primitive-rest: #a855f7;
  --primitive-social: #10b981;
  
  /* Neutrals */
  --primitive-black-900: #0f172a;
  --primitive-white: #ffffff;
  /* ... more primitives */
}
```

**Purpose:** Base color palette that never changes at runtime

---

#### Layer 2: Semantic (Purpose-based, maps to primitives)

```css
:root {
  /* Dynamic Context Color (changes when user switches contexts) */
  --color-context-current: var(--primitive-work);  /* Default to work */
  
  /* Background Colors */
  --color-bg-primary: var(--primitive-black-900);
  --color-bg-secondary: var(--primitive-gray-800);
  
  /* Text Colors */
  --color-text-primary: var(--primitive-white);
  --color-text-secondary: var(--primitive-gray-400);
  
  /* Interactive States */
  --color-interactive-default: var(--primitive-blue-500);
  --color-interactive-hover: var(--primitive-blue-400);
  /* ... more semantic tokens */
}
```

**Purpose:** Purpose-driven tokens that describe intent (e.g., "primary background", "error text")

---

#### Layer 3: Component-specific (Maps to semantic tokens)

```css
:root {
  /* Buttons */
  --button-bg-primary: var(--color-context-current);
  --button-bg-hover: color-mix(in srgb, var(--color-context-current) 90%, white);
  
  /* Cards */
  --card-border-default: var(--color-border-default);
  --card-border-active: var(--color-context-current);
  
  /* Navigation */
  --nav-bg: var(--color-bg-primary);
  --nav-border: var(--color-border-default);
  /* ... more component tokens */
}
```

**Purpose:** Component-specific styling that references semantic tokens

---

### Runtime Theming (Context Switching)

When a user switches contexts (e.g., from "Work" to "Personal"), the entire UI updates instantly:

```typescript
// src/components/contexts/context-switcher.tsx
function switchContext(newContext: Context) {
  // Update CSS custom property at runtime
  document.documentElement.style.setProperty(
    '--color-context-current',
    newContext.color  // e.g., "#f97316" (Personal orange)
  );
  
  // All components using var(--color-context-current) update instantly
  // No React re-renders needed ✨
}
```

**What Updates Automatically:**
- Button backgrounds and borders
- Active card highlights
- Navigation accents
- Focus indicators
- Interactive elements

**Benefits:**
- ⚡ **Instant Updates**: No component re-renders
- 🎨 **Consistent Theming**: All components stay synchronized
- 🧩 **Maintainable**: Change once, apply everywhere
- 🔄 **Dynamic**: Context colors can be user-customizable

---

### Typography Tokens

```css
/* src/app/styles/tokens/typography.css */
:root {
  /* Font Families */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  
  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

---

### Spacing Tokens

```css
/* src/app/styles/tokens/spacing.css */
:root {
  /* 4px base unit */
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
}
```

---

### Effects Tokens

```css
/* src/app/styles/tokens/effects.css */
:root {
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Border Radius */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  
  /* Z-Index */
  --z-dropdown: 1000;
  --z-modal: 1100;
  --z-toast: 1200;
}
```

---

### Usage Example

```tsx
// Button component using design tokens
export function Button({ variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={cn(
        // Uses component tokens
        'bg-[var(--button-bg-primary)]',
        'hover:bg-[var(--button-bg-hover)]',
        'text-[var(--button-text-primary)]',
        'px-[var(--spacing-4)]',
        'py-[var(--spacing-2)]',
        'rounded-[var(--radius-md)]',
        'shadow-[var(--shadow-sm)]',
      )}
    >
      {children}
    </button>
  );
}
```

**When context switches, the button color updates automatically!**

---

### 🚨 CRITICAL: Token Management Rules

**Never add new tokens without UX approval**. All necessary tokens already exist:

- ✅ Use existing tokens from `src/app/styles/tokens/`
- ✅ Reference complete usage guide: `docs/ux-design-tokens/css-tokens-usage.md`
- ❌ Don't create new tokens
- ❌ Don't hardcode colors/spacing in components

---

## Setup

### Prerequisites

- **Bun 1.x** or later
- **1Password CLI** (`op`) for secret management
- **Logto Account** for authentication

### Installation

```bash
# From root directory
cd my_flow_client

# Install dependencies
bun install
```

### Environment Variables

Create `.env.local` or use 1Password CLI (recommended):

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Logto Authentication
NEXT_PUBLIC_LOGTO_ENDPOINT=https://YOUR_TENANT.logto.app
NEXT_PUBLIC_LOGTO_APP_ID=your_app_id
NEXT_PUBLIC_LOGTO_RESOURCE=https://api.myflow.dev
LOGTO_APP_SECRET=your_app_secret
LOGTO_COOKIE_SECRET=your_cookie_secret

# Base URL
NEXTAUTH_URL=http://localhost:3000
```

**With 1Password (Recommended):**

```bash
# All secrets injected automatically
bun run dev
```

### Logto Setup

1. **Create Application** at [Logto Cloud Console](https://cloud.logto.io/)
2. **Choose:** "Traditional Web App" (not SPA)
3. **Note credentials:**
   - App ID → `NEXT_PUBLIC_LOGTO_APP_ID`
   - App Secret → `LOGTO_APP_SECRET`
   - Endpoint → `NEXT_PUBLIC_LOGTO_ENDPOINT`

4. **Configure Redirect URIs:**
   - Sign-in redirect: `http://localhost:3000/callback`
   - Sign-out redirect: `http://localhost:3000`
   - Post sign-out redirect: `http://localhost:3000`

5. **Enable API Resource:**
   - Go to API Resources
   - Create resource: `https://api.myflow.dev`
   - Add to `NEXT_PUBLIC_LOGTO_RESOURCE`

### Running the App

```bash
# Development with 1Password secrets
bun run dev

# Or manually (without 1Password)
bun run dev:direct
```

Visit: `http://localhost:3000`

---

## Project Structure

```
my_flow_client/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/                # Login page
│   │   │   └── callback/             # OAuth callback
│   │   ├── api/                      # BFF API routes
│   │   │   ├── chat/stream/          # Chat stream proxy
│   │   │   ├── contexts/             # Contexts API proxy
│   │   │   ├── flows/                # Flows API proxy
│   │   │   └── preferences/          # Preferences API proxy
│   │   ├── dashboard/                # Main dashboard
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   └── styles/                   # Global styles + tokens
│   │       └── tokens/               # CSS design tokens
│   ├── components/                   # React components
│   │   ├── chat/                     # Chat UI components
│   │   ├── contexts/                 # Context management UI
│   │   ├── flows/                    # Flow list/item UI
│   │   ├── onboarding/               # Onboarding flow
│   │   ├── providers/                # Context providers
│   │   └── ui/                       # shadcn/ui components
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-chat-stream.ts        # Chat streaming hook
│   │   ├── use-contexts.ts           # Contexts CRUD hook
│   │   ├── use-flows.ts              # Flows CRUD hook
│   │   └── use-preferences.ts        # User preferences hook
│   ├── lib/                          # Utilities
│   │   ├── actions/                  # Server Actions
│   │   │   └── auth.ts               # Auth actions
│   │   ├── api/                      # API client functions
│   │   │   ├── contexts.ts           # Contexts API
│   │   │   ├── flows.ts              # Flows API
│   │   │   └── chat.ts               # Chat API
│   │   ├── api-client.ts             # Centralized fetch wrapper
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── logto.ts                  # Logto configuration
│   │   ├── context-theme.ts          # Dynamic theming
│   │   └── utils.ts                  # Helper functions
│   └── types/                        # TypeScript types
│       ├── context.ts                # Context types
│       ├── flow.ts                   # Flow types
│       ├── api.ts                    # API response types
│       └── ai-context.ts             # AI context types
├── __tests__/                        # Integration tests
│   └── integration/                  # E2E integration tests
├── e2e/                              # Playwright E2E tests
├── public/                           # Static assets
│   └── screenshots/                  # App screenshots
├── components.json                   # shadcn/ui config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── vitest.config.ts                  # Vitest config
├── playwright.config.ts              # Playwright config
└── package.json                      # Dependencies
```

---

## Testing

### Test Strategy (70/20/10 Pyramid)

- **70% Unit Tests** (Vitest) - Components, hooks, utilities
- **20% Integration Tests** (Vitest + MSW) - API interactions
- **10% E2E Tests** (Playwright) - Critical user flows

### Unit Tests (Vitest)

**Run Tests:**
```bash
bun test              # Run all tests
bun test:watch        # Watch mode
bun test:coverage     # With coverage (≥80% required)
```

**Example Test:**

```typescript
// hooks/__tests__/use-flows.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useFlows, useCreateFlow } from '../use-flows';

describe('useFlows', () => {
  it('fetches flows successfully', async () => {
    const { result } = renderHook(() => useFlows('ctx-1'));
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual([
      { id: '1', title: 'Task 1', context_id: 'ctx-1' }
    ]);
  });
  
  it('handles optimistic updates', async () => {
    const { result: flowsResult } = renderHook(() => useFlows('ctx-1'));
    const { result: createResult } = renderHook(() => useCreateFlow());
    
    act(() => {
      createResult.current.mutate({
        title: 'New Task',
        context_id: 'ctx-1'
      });
    });
    
    // Immediately shows in UI (optimistic)
    expect(flowsResult.current.data).toContainEqual(
      expect.objectContaining({ title: 'New Task' })
    );
  });
});
```

### Integration Tests (Vitest + MSW)

**Mock Server Setup:**

```typescript
// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Example Integration Test:**

```typescript
// __tests__/integration/context-chat-integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Context-Chat Integration', () => {
  it('loads conversation history when switching contexts', async () => {
    render(<ChatInterface contextId="ctx-work" />);
    
    await waitFor(() => {
      expect(screen.getByText('Previous message')).toBeInTheDocument();
    });
    
    // Switch context
    await userEvent.click(screen.getByText('Personal'));
    
    // Previous conversation cleared
    expect(screen.queryByText('Previous message')).not.toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

**Run E2E Tests:**
```bash
bun test:e2e          # Headless mode
bun test:e2e:ui       # UI mode
bun test:e2e:debug    # Debug mode
```

**Example E2E Test:**

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete authentication flow', async ({ page }) => {
  // Start at home page
  await page.goto('http://localhost:3000');
  
  // Click sign in
  await page.click('text=Sign In');
  
  // Should redirect to Logto
  await expect(page).toHaveURL(/logto\.app/);
  
  // Fill in credentials
  await page.fill('[name="identifier"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Should redirect back to app
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  
  // User should be authenticated
  await expect(page.locator('text=Sign Out')).toBeVisible();
});
```

### Coverage Requirements

- **Line Coverage:** ≥ 80%
- **Branch Coverage:** ≥ 80%
- **Function Coverage:** ≥ 80%

**Enforcement:**
- Pre-push Git hooks verify coverage
- CI/CD fails if coverage drops below 80%

---

## Code Quality

### Linting (ESLint v9)

```bash
bun run lint          # Check for issues
bun run lint:fix      # Auto-fix issues
```

**Configuration:** `eslint.config.mjs` (Flat config format)

### Formatting (Prettier)

```bash
bun run format        # Format all files
bun run format:check  # Check formatting
```

### Type Checking (TypeScript)

```bash
bun run typecheck     # Type check entire project
```

**Configuration:** `tsconfig.json` (Strict mode enabled)

### Pre-commit Hooks (Husky + lint-staged)

**Runs automatically on `git commit`:**
- ✅ Auto-format changed files (Prettier)
- ✅ Lint changed files (ESLint)
- ✅ Type check changed files (tsc)

**Runs automatically on `git push`:**
- ✅ Full linting
- ✅ Full type checking
- ✅ Full test suite with coverage (≥80%)
- ✅ Production build verification

---

## Available Scripts

### Development
```bash
bun dev              # Start dev server with 1Password secrets
bun dev:direct       # Start dev server without 1Password
```

### Building
```bash
bun build            # Build for production
bun start            # Start production server
```

### Testing
```bash
bun test             # Unit tests
bun test:watch       # Unit tests (watch)
bun test:coverage    # Unit tests with coverage
bun test:e2e         # E2E tests (headless)
bun test:e2e:ui      # E2E tests (UI mode)
bun test:e2e:debug   # E2E tests (debug)
```

### Code Quality
```bash
bun lint             # Lint
bun lint:fix         # Lint and auto-fix
bun format           # Format
bun format:check     # Check formatting
bun typecheck        # Type check
```

---

## shadcn/ui Components

Add UI components using the shadcn CLI:

```bash
# Add a single component
bunx shadcn@latest add button

# Add multiple components
bunx shadcn@latest add button card dialog

# List available components
bunx shadcn@latest add
```

**Components are copied to:** `src/components/ui/`

**Configuration:** `components.json`

---

## Additional Resources

- **Root README:** [../README.md](../README.md) - High-level project overview
- **Backend README:** [../my_flow_api/README.md](../my_flow_api/README.md) - FastAPI backend details
- **Architecture Docs:** [../docs/architecture/](../docs/architecture/) - Detailed technical documentation
- **CSS Design Tokens:** [../docs/ux-design-tokens/css-tokens-usage.md](../docs/ux-design-tokens/css-tokens-usage.md)

---

## Support

For issues or questions:
- Check the [Architecture Documentation](../docs/architecture/)
- Review the [Root README](../README.md)
- Consult the [Backend README](../my_flow_api/README.md)
