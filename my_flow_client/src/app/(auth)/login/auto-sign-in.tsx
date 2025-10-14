'use client';

import { useEffect } from 'react';

interface AutoSignInProps {
  action: () => Promise<void>;
}

export function AutoSignIn({ action }: AutoSignInProps): null {
  useEffect(() => {
    // Automatically trigger sign-in on component mount
    void action();
  }, [action]);

  // Return null - no UI needed, just triggers redirect
  return null;
}
