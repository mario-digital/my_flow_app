/**
 * User Preferences API client
 *
 * All requests go through BFF /api/preferences proxy.
 * JWT tokens stay server-side; browser never sees them.
 */

import type {
  UserPreferences,
  UserPreferencesUpdate,
} from '@/types/preferences';

/**
 * Fetch user preferences, creating defaults if none exist
 */
export async function getPreferences(): Promise<UserPreferences> {
  const response = await fetch('/api/preferences', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch preferences');
  }

  return response.json() as Promise<UserPreferences>;
}

/**
 * Update user preferences (partial update)
 */
export async function updatePreferences(
  updates: UserPreferencesUpdate
): Promise<UserPreferences> {
  const response = await fetch('/api/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update preferences');
  }

  return response.json() as Promise<UserPreferences>;
}

/**
 * Mark onboarding as complete
 */
export async function markOnboardingComplete(): Promise<UserPreferences> {
  return updatePreferences({
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  });
}

/**
 * Set current active context
 */
export async function setCurrentContext(
  contextId: string | null
): Promise<UserPreferences> {
  return updatePreferences({
    current_context_id: contextId,
  });
}
