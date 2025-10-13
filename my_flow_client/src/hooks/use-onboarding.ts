import { useState, useMemo } from 'react';
import { useContexts } from './use-contexts';
import { usePreferences, useMarkOnboardingComplete } from './use-preferences';

/**
 * Hook to manage onboarding state.
 * Automatically shows onboarding if user has 0 contexts and hasn't completed onboarding.
 * Uses database-backed preferences instead of localStorage.
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

  // Get contexts and preferences from DB
  const { data: contexts } = useContexts();
  const { data: preferences } = usePreferences();
  const markComplete = useMarkOnboardingComplete();

  // Compute whether onboarding should be open
  const isOpen = useMemo(() => {
    // Manual trigger overrides everything
    if (manuallyTriggered) return true;

    // If manually dismissed, don't show
    if (manuallyDismissed) return false;

    // Wait for data to load
    if (!contexts || !preferences) return false;

    // Show if: no contexts AND haven't completed onboarding
    return !preferences.onboarding_completed && contexts.length === 0;
  }, [contexts, preferences, manuallyDismissed, manuallyTriggered]);

  const handleClose = (): void => {
    setManuallyDismissed(true);
    setManuallyTriggered(false);
    // Mark as completed in database
    void markComplete.mutate();
  };

  const handleComplete = (): void => {
    setManuallyDismissed(true);
    setManuallyTriggered(false);
    // Mark as completed in database
    void markComplete.mutate();
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
