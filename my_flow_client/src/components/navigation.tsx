import type { JSX } from 'react';
import Link from 'next/link';
import { getLogtoContext, signOut } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { Button } from '@/components/ui/button';

export async function Navigation(): Promise<JSX.Element> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-foreground">
          MyFlow
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                {claims?.email}
              </span>
              <form
                action={async () => {
                  'use server';
                  await signOut(logtoConfig);
                }}
              >
                <Button variant="outline" type="submit">
                  Sign Out
                </Button>
              </form>
            </>
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
