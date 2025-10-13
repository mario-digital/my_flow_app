'use client';

import { OnboardingModal } from './onboarding-modal';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { ReactElement } from 'react';

/**
 * Client-side wrapper for the onboarding modal.
 * This component manages the onboarding state and renders the modal when needed.
 * Only renders for authenticated users to avoid errors with useContexts.
 */
export function OnboardingWrapper(): ReactElement | null {
  const { isAuthenticated } = useCurrentUser();

  // Only render onboarding for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return <OnboardingWrapperInner />;
}

/**
 * Inner wrapper that uses useOnboarding (which requires authentication).
 * Separated to avoid calling useOnboarding before authentication check.
 */
function OnboardingWrapperInner(): ReactElement {
  const { isOpen, handleClose, handleComplete } = useOnboarding();

  return (
    <OnboardingModal
      isOpen={isOpen}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
}
