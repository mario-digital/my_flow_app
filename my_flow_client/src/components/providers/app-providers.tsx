'use client';

import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
} from 'react';

const CONTEXT_STORAGE_KEY = 'my-flow-current-context';

/**
 * QueryClient instance configured for the application.
 * - Queries stale after 5 minutes (contexts/flows don't change frequently)
 * - Garbage collected after 10 minutes of being unused
 * - Auto-refetch when user returns to tab (keeps data fresh)
 * - Retry failed queries once (network hiccups)
 * - Don't retry mutations (prevents duplicate operations)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
      refetchOnWindowFocus: true, // Auto-sync when user returns to tab
      retry: 1, // Retry failed requests once
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

/**
 * Context selection state interface.
 * Tracks which context is currently selected for viewing flows and conversations.
 */
interface ContextSelectionState {
  currentContextId: string | null;
  setCurrentContextId: (id: string) => void;
}

/**
 * React Context for context selection state.
 * Provides access to current context ID and setter throughout the app.
 */
const ContextSelectionContext = createContext<
  ContextSelectionState | undefined
>(undefined);

/**
 * Internal provider component for context selection state.
 * Manages current context ID with localStorage persistence.
 *
 * @internal - Not exported, used only within AppProviders
 */
function ContextSelectionProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [currentContextId, setCurrentContextIdState] = useState<string | null>(
    null
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedId = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
    const setIdTimeout = savedId
      ? window.setTimeout(() => {
          startTransition(() => {
            setCurrentContextIdState(savedId);
          });
        }, 0)
      : undefined;

    const hydrationTimeout = window.setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => {
      if (setIdTimeout !== undefined) {
        window.clearTimeout(setIdTimeout);
      }
      window.clearTimeout(hydrationTimeout);
    };
  }, []);

  // Persist context ID to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) {
      return;
    }
    if (currentContextId) {
      window.localStorage.setItem(CONTEXT_STORAGE_KEY, currentContextId);
    } else {
      window.localStorage.removeItem(CONTEXT_STORAGE_KEY);
    }
  }, [currentContextId, isHydrated]);

  const setCurrentContextId = (id: string): void => {
    setCurrentContextIdState(id);
  };

  return (
    <ContextSelectionContext.Provider
      value={{ currentContextId, setCurrentContextId }}
    >
      {children}
    </ContextSelectionContext.Provider>
  );
}

/**
 * Combined application providers wrapper.
 * Combines QueryClientProvider and ContextSelectionProvider into a single component.
 *
 * Benefits:
 * - Reduces nesting depth from 3 to 2 levels (CurrentUser → App)
 * - Simplifies debugging (single provider component to inspect)
 * - Keeps related state management together (Query + Context selection)
 *
 * Provider hierarchy:
 * ```
 * CurrentUserProvider (from layout.tsx)
 *   ├─ AppProviders
 *   │   ├─ QueryClientProvider (TanStack Query)
 *   │   └─ ContextSelectionProvider (UI state)
 *   └─ App content (Navigation + children)
 * ```
 *
 * @param children - React children to wrap with providers
 */
export function AppProviders({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ContextSelectionProvider>{children}</ContextSelectionProvider>
    </QueryClientProvider>
  );
}

/**
 * Hook to access current context selection state.
 * Must be used within AppProviders.
 *
 * @returns Current context ID and setter function
 * @throws Error if used outside AppProviders
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentContextId, setCurrentContextId } = useCurrentContext();
 *   // Use currentContextId to filter flows, etc.
 * }
 * ```
 */
export function useCurrentContext(): ContextSelectionState {
  const context = useContext(ContextSelectionContext);
  if (!context) {
    throw new Error('useCurrentContext must be used within AppProviders');
  }
  return context;
}
