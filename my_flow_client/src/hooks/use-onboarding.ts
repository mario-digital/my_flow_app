import { useState, useMemo } from 'react';
import { useContexts } from './use-contexts';

/**
 * Hook to manage onboarding state.
 * Automatically shows onboarding if user has 0 contexts and hasn't seen it before.
 */
export function useOnboarding(): {
  isOpen: boolean;
  handleClose: () => void;
  handleComplete: () => void;
  triggerManually: () => void;
} {
  // Track whether user manually closed or if we should show manually
  const [manuallyDismissed, setManuallyDismissed] = useState(false);
  const [manuallyTriggered, setManuallyTriggered] = useState(false);

  // Reuse the contexts query from useContexts to avoid duplication
  const { data: contexts } = useContexts();

  // Compute whether onboarding should be open
  const isOpen = useMemo(() => {
    // Manual trigger overrides everything
    if (manuallyTriggered) return true;

    // If manually dismissed, don't show
    if (manuallyDismissed) return false;

    // Wait for contexts to load
    if (!contexts) return false;

    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');

    // Show if: no contexts AND haven't seen onboarding
    return !hasSeenOnboarding && contexts.length === 0;
  }, [contexts, manuallyDismissed, manuallyTriggered]);

  const handleClose = (): void => {
    setManuallyDismissed(true);
    setManuallyTriggered(false);
    // Mark as seen in localStorage
    localStorage.setItem('has_seen_onboarding', 'true');
  };

  const handleComplete = (): void => {
    setManuallyDismissed(true);
    setManuallyTriggered(false);
    // Mark as seen in localStorage
    localStorage.setItem('has_seen_onboarding', 'true');
    // Refresh contexts after completion
    window.location.reload();
  };

  const triggerManually = (): void => {
    setManuallyTriggered(true);
    setManuallyDismissed(false);
  };

  return {
    isOpen,
    handleClose,
    handleComplete,
    triggerManually,
  };
}
