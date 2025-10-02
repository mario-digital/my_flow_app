import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from './logto';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect('/login');
  }

  return claims;
}