'use client';

import { Button } from '@/components/ui/button';

interface SignInProps {
  action: () => Promise<void>;
}

export function SignIn({ action }: SignInProps) {
  return (
    <form action={action}>
      <Button type="submit" className="w-full">
        Sign in with Logto
      </Button>
    </form>
  );
}
