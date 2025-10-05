import type { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getLogtoContext, signIn } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { SignIn } from './sign-in';

export default async function LoginPage(): Promise<JSX.Element | never> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  async function handleSignIn(): Promise<void> {
    'use server';
    await signIn(logtoConfig);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-card-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome to MyFlow
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to continue
          </p>
        </div>
        <SignIn action={handleSignIn} />
      </div>
    </div>
  );
}
