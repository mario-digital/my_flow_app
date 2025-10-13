/**
 * User Preferences types matching backend schema
 */

export interface UserPreferences {
  id: string;
  user_id: string;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  current_context_id: string | null;
  theme: 'light' | 'dark' | 'system' | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  current_context_id?: string | null;
  theme?: 'light' | 'dark' | 'system' | null;
  notifications_enabled?: boolean;
}
