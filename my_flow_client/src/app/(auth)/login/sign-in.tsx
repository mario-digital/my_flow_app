'use client';

import type { JSX } from 'react';
import { Button } from '@/components/ui/button';

interface SignInProps {
  action: () => Promise<void>;
}

export function SignIn({ action }: SignInProps): JSX.Element {
  return (
    <form action={action}>
      <Button type="submit" className="w-full">
        Sign in with Logto
      </Button>
    </form>
  );
}
