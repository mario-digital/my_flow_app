import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ContextWithSummary } from '@/types/context-summary';

/**
 * Fetches all context summaries for the current user.
 * Combines context metadata with AI-generated summaries.
 * Cached for 5 minutes to reduce API calls.
 */
export function useContextSummaries(): UseQueryResult<
  ContextWithSummary[],
  Error
> {
  return useQuery<ContextWithSummary[], Error>({
    queryKey: ['context-summaries'],
    queryFn: async (): Promise<ContextWithSummary[]> => {
      const response = await fetch('/api/contexts/summaries', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch context summaries');
      }

      return (await response.json()) as ContextWithSummary[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}
