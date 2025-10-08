import type { ReactNode, ReactElement } from 'react';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import {
  CurrentUserProvider,
  type CurrentUserState,
} from '@/hooks/use-current-user';

/**
 * Server component provider for current user context.
 *
 * This async server component fetches the Logto session on the server side
 * and passes the user state to the client CurrentUserProvider. This pattern
 * allows client components to access authenticated user data without making
 * additional API calls.
 *
 * The provider supplies a request-time snapshot. If the session changes
 * (e.g., logout in another tab), the state will not update reactively.
 * Components handling 401 errors should trigger revalidation or reload.
 *
 * Usage: Wrap your app layout with this provider to make useCurrentUser()
 * available throughout the component tree.
 *
 * @param children - Child components that need access to current user
 *
 * @example
 * ```typescript
 * // app/layout.tsx
 * export default async function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <CurrentUserServerProvider>
 *           <Navigation />
 *           {children}
 *         </CurrentUserServerProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export async function CurrentUserServerProvider({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  // Fetch Logto session context on the server
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  // Map Logto claims to CurrentUserState
  const value: CurrentUserState = {
    userId: claims?.sub ?? null,
    email: claims?.email,
    name: claims?.name,
    claims: claims ?? null,
    isAuthenticated,
    isLoading: false, // Server-rendered, so loading is always false
  };

  // Pass server-fetched state to client provider
  return <CurrentUserProvider value={value}>{children}</CurrentUserProvider>;
}
