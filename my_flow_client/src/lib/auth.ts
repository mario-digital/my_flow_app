import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from './logto';
import { redirect } from 'next/navigation';
import type { IdTokenClaims } from '@logto/next';

export async function requireAuth(): Promise<IdTokenClaims | undefined | never> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect('/login');
  }

  return claims;
}