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
import { useSetCurrentContext, usePreferences } from '@/hooks/use-preferences';
import { useCurrentUser } from '@/hooks/use-current-user';

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
 * Manages current context ID with DATABASE as source of truth.
 *
 * Security: Loads from DB first to prevent context leaking between users.
 * localStorage is used only as a temporary cache until DB loads.
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
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);

  // Get current user and preferences from DB
  const { isAuthenticated, isLoading: isLoadingUser } = useCurrentUser();
  const { data: preferences, isLoading: isLoadingPrefs } = usePreferences();
  const setContextInDB = useSetCurrentContext();

  // 1. Initial hydration from localStorage (temporary until DB loads)
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

  // 2. Load from DB once authenticated (OVERRIDES localStorage)
  useEffect(() => {
    if (
      !isAuthenticated ||
      isLoadingUser ||
      isLoadingPrefs ||
      hasLoadedFromDB
    ) {
      return;
    }

    if (preferences?.current_context_id) {
      // DB value takes precedence - update state AND localStorage
      startTransition(() => {
        setCurrentContextIdState(preferences.current_context_id);
      });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          CONTEXT_STORAGE_KEY,
          preferences.current_context_id
        );
      }
    }

    startTransition(() => {
      setHasLoadedFromDB(true);
    });
  }, [
    isAuthenticated,
    isLoadingUser,
    preferences,
    isLoadingPrefs,
    hasLoadedFromDB,
  ]);

  // 3. Clear localStorage when user signs out
  useEffect(() => {
    if (!isAuthenticated && !isLoadingUser && isHydrated) {
      // User signed out - clear everything
      startTransition(() => {
        setCurrentContextIdState(null);
        setHasLoadedFromDB(false);
      });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(CONTEXT_STORAGE_KEY);
      }
    }
  }, [isAuthenticated, isLoadingUser, isHydrated]);

  // 4. Persist to localStorage when it changes (after DB load)
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated || !hasLoadedFromDB) {
      return;
    }
    if (currentContextId) {
      window.localStorage.setItem(CONTEXT_STORAGE_KEY, currentContextId);
    } else {
      window.localStorage.removeItem(CONTEXT_STORAGE_KEY);
    }
  }, [currentContextId, isHydrated, hasLoadedFromDB]);

  const setCurrentContextId = (id: string): void => {
    setCurrentContextIdState(id);
    // Sync to database (optimistic update happens in hook)
    void setContextInDB.mutate(id);
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
