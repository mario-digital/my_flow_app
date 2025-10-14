import type { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getLogtoContext, signIn } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { AutoSignIn } from './auto-sign-in';

export default async function LoginPage(): Promise<JSX.Element | never> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  // If already authenticated, go to dashboard
  if (isAuthenticated) {
    redirect('/dashboard');
  }

  // Server Action for signing in
  async function handleSignIn(): Promise<void> {
    'use server';
    await signIn(logtoConfig);
  }

  // Render client component that auto-triggers sign-in
  return <AutoSignIn action={handleSignIn} />;
}
