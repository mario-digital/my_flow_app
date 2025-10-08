'use client';

import { createContext, useContext } from 'react';
import type { IdTokenClaims } from '@logto/next';

/**
 * Current user state derived from Logto session.
 *
 * This interface provides a request-time snapshot of the authenticated user.
 * The state is set by the server component provider and remains static during
 * the request lifecycle.
 *
 * Note: This is a snapshot. If the session changes (e.g., logout in another tab),
 * the state will not update reactively. API requests returning 401 should trigger
 * session revalidation or page reload.
 */
export interface CurrentUserState {
  /** Logto user ID from JWT `sub` claim, or null if unauthenticated */
  userId: string | null;
  /** User email from JWT claims */
  email?: string | null;
  /** User display name from JWT claims */
  name?: string | null;
  /** Full Logto JWT claims object */
  claims?: IdTokenClaims | null;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** True if auth state is still loading */
  isLoading: boolean;
}

/**
 * Context for current user state.
 *
 * Provides authenticated user information to client components without
 * duplicating auth logic. The provider (CurrentUserServerProvider) fetches
 * session data via Logto server actions.
 */
const CurrentUserContext = createContext<CurrentUserState | undefined>(
  undefined
);

/**
 * Client provider component for current user context.
 *
 * This component wraps children with the CurrentUserContext provider,
 * making user state available to all descendant components via useCurrentUser().
 *
 * Do not use this directly - use CurrentUserServerProvider instead, which
 * fetches session data on the server and passes it to this client provider.
 *
 * @param value - Current user state from server
 * @param children - Child components
 */
export function CurrentUserProvider({
  value,
  children,
}: {
  value: CurrentUserState;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * Hook to access current user state.
 *
 * Returns the authenticated user's information from Logto session.
 * Must be used within a component wrapped by CurrentUserServerProvider.
 *
 * @returns Current user state with userId, email, name, and auth status
 * @throws Error if used outside CurrentUserServerProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { userId, isAuthenticated } = useCurrentUser();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please sign in</div>;
 *   }
 *
 *   return <div>Welcome, user {userId}</div>;
 * }
 * ```
 */
export function useCurrentUser(): CurrentUserState {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error(
      'useCurrentUser must be used within CurrentUserProvider (wrap app in CurrentUserServerProvider).'
    );
  }

  return context;
}
