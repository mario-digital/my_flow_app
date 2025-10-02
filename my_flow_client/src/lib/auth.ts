import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from './logto';
import { redirect } from 'next/navigation';
import type { IdTokenClaims } from '@logto/next';

/**
 * Requires user authentication for protected routes.
 *
 * This function checks if the user is authenticated by verifying the Logto session.
 * If the user is not authenticated, it redirects them to the login page.
 * If authenticated, it returns the user's ID token claims.
 *
 * **Usage:** Call this function at the top of server components or server actions
 * that require authentication.
 *
 * @returns {Promise<IdTokenClaims | undefined>} The user's ID token claims if authenticated
 * @throws {Error} Redirects to `/login` if user is not authenticated
 *
 * @example
 * ```typescript
 * // In a server component
 * export default async function DashboardPage() {
 *   const claims = await requireAuth();
 *   return <div>Welcome {claims?.sub}</div>;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In a server action
 * 'use server';
 * export async function deleteItem(itemId: string) {
 *   await requireAuth(); // Ensure user is authenticated
 *   // ... delete logic
 * }
 * ```
 */
export async function requireAuth(): Promise<
  IdTokenClaims | undefined | never
> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect('/login');
  }

  return claims;
}
