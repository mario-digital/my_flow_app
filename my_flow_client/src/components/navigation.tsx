'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { signOut } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { ContextSwitcher } from '@/components/contexts/context-switcher';
import { useContexts } from '@/hooks/use-contexts';
import { useCurrentContext } from '@/components/providers/app-providers';
import { useCurrentUser } from '@/hooks/use-current-user';

/**
 * Authenticated navigation section with context switcher.
 * Separated to avoid calling hooks conditionally.
 */
function AuthenticatedNav({
  email,
}: {
  email: string | null | undefined;
}): JSX.Element {
  const { data: contexts, isLoading } = useContexts();
  const { currentContextId, setCurrentContextId } = useCurrentContext();

  return (
    <>
      {/* Context Switcher - Only show when contexts are loaded and available */}
      {!isLoading && contexts && contexts.length > 0 && (
        <ContextSwitcher
          currentContextId={currentContextId ?? contexts[0]?.id ?? ''}
          contexts={contexts}
          onContextChange={setCurrentContextId}
          className="min-w-[200px]"
        />
      )}
      <span className="text-sm text-text-secondary">{email}</span>
      <form action={signOut}>
        <Button variant="secondary" type="submit">
          Sign Out
        </Button>
      </form>
    </>
  );
}

export function Navigation(): JSX.Element {
  const { isAuthenticated, email } = useCurrentUser();

  return (
    <nav className="border-b border-border-default bg-bg-primary">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-text-primary">
          MyFlow
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <AuthenticatedNav email={email} />
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
