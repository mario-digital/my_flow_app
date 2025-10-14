'use server';

import { signOut as logtoSignOut } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { redirect } from 'next/navigation';

/**
 * Server action to sign out the current user.
 * This action must be in a separate file with 'use server' at the top
 * because it's used in a Client Component (Navigation).
 */
export async function signOut(): Promise<never> {
  await logtoSignOut(logtoConfig);
  // The above should redirect, but if it doesn't, redirect manually
  redirect('/');
}
