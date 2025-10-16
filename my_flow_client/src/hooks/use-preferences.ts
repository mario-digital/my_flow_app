'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getPreferences,
  updatePreferences,
  markOnboardingComplete,
  setCurrentContext,
} from '@/lib/api/preferences';
import { transformError } from '@/lib/errors';
import type {
  UserPreferences,
  UserPreferencesUpdate,
} from '@/types/preferences';
import { useCurrentUser } from '@/hooks/use-current-user';

/**
 * Hierarchical query keys for preferences.
 *
 * Single preferences document per user, so simpler structure than contexts.
 */
export const preferencesKeys = {
  all: ['preferences'] as const,
  detail: () => [...preferencesKeys.all, 'detail'] as const,
};

/**
 * Mutation keys for preferences operations.
 */
export const preferencesMutations = {
  update: () => ['preferences', 'update'] as const,
};

/**
 * Mutation context types
 */
type PreferencesMutationContext = {
  previous?: UserPreferences;
};

/**
 * Hook to fetch user preferences.
 *
 * Automatically creates default preferences if none exist.
 * Only runs when user is authenticated.
 */
export function usePreferences(): UseQueryResult<UserPreferences, Error> {
  const { isAuthenticated, isLoading: isLoadingUser } = useCurrentUser();

  const query = useQuery<UserPreferences, Error>({
    queryKey: preferencesKeys.detail(),
    queryFn: getPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes - preferences rarely change
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: isAuthenticated && !isLoadingUser, // Only fetch when authenticated
    retry: 1, // Only retry once if backend is down
    retryDelay: 1000, // Wait 1 second before retrying
  });

  // Debug logging for errors only
  if (query.error) {
    console.error('[usePreferences] Error fetching preferences:', query.error);
  }

  return query;
}

/**
 * Hook to update user preferences with optimistic updates.
 */
export function useUpdatePreferences(): UseMutationResult<
  UserPreferences,
  Error,
  UserPreferencesUpdate,
  PreferencesMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation<
    UserPreferences,
    Error,
    UserPreferencesUpdate,
    PreferencesMutationContext
  >({
    mutationKey: preferencesMutations.update(),
    mutationFn: updatePreferences,
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: preferencesKeys.detail(),
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<UserPreferences>(
        preferencesKeys.detail()
      );

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<UserPreferences>(
          preferencesKeys.detail(),
          (old: UserPreferences | undefined) =>
            old
              ? {
                  ...old,
                  ...updates,
                  updated_at: new Date().toISOString(),
                }
              : old
        );
      }

      return { previous };
    },
    onError: (error, _updates, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData<UserPreferences>(
          preferencesKeys.detail(),
          context.previous
        );
      }

      const appError = transformError(error);
      toast.error('Failed to update preferences', {
        description: appError.userMessage || appError.message,
      });
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      void queryClient.invalidateQueries({
        queryKey: preferencesKeys.detail(),
      });
    },
  });
}

/**
 * Hook to mark onboarding as complete.
 */
export function useMarkOnboardingComplete(): UseMutationResult<
  UserPreferences,
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation<UserPreferences, Error, void>({
    mutationKey: preferencesMutations.update(),
    mutationFn: markOnboardingComplete,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: preferencesKeys.detail(),
      });
      toast.success('Welcome to MyFlow! 🎉');
    },
    onError: (error) => {
      const appError = transformError(error);
      toast.error('Failed to complete onboarding', {
        description: appError.userMessage || appError.message,
      });
    },
  });
}

/**
 * Hook to set current active context.
 */
export function useSetCurrentContext(): UseMutationResult<
  UserPreferences,
  Error,
  string | null,
  PreferencesMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation<
    UserPreferences,
    Error,
    string | null,
    PreferencesMutationContext
  >({
    mutationKey: preferencesMutations.update(),
    mutationFn: setCurrentContext,
    onMutate: async (contextId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: preferencesKeys.detail(),
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<UserPreferences>(
        preferencesKeys.detail()
      );

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<UserPreferences>(
          preferencesKeys.detail(),
          (old: UserPreferences | undefined) =>
            old
              ? {
                  ...old,
                  current_context_id: contextId,
                  updated_at: new Date().toISOString(),
                }
              : old
        );
      }

      return { previous };
    },
    onError: (error, _contextId, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData<UserPreferences>(
          preferencesKeys.detail(),
          context.previous
        );
      }

      const appError = transformError(error);
      toast.error('Failed to switch context', {
        description: appError.userMessage || appError.message,
      });
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      void queryClient.invalidateQueries({
        queryKey: preferencesKeys.detail(),
      });
    },
  });
}
