'use client';

import { useQuery } from '@tanstack/react-query';
import type { Conversation, Message } from '@/types/chat';

/**
 * Query key factory for conversation history queries.
 * Ensures consistent cache keys across the application.
 */
export const conversationKeys = {
  all: ['conversations'] as const,
  byContext: (contextId: string) =>
    [...conversationKeys.all, 'context', contextId] as const,
};

/**
 * Result interface for useConversationHistory hook.
 */
export interface ConversationHistoryResult {
  /** Message history (last 50 messages) */
  messages: Message[];

  /** Conversation ID (null if no history) */
  conversationId: string | null;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;
}

/**
 * React hook for fetching conversation history via TanStack Query.
 *
 * Loads the most recent conversation for a given context ID.
 * Implements caching with 5-minute stale time for optimal performance.
 *
 * @param contextId - Context ID to fetch conversation history for
 * @returns ConversationHistoryResult with messages, loading, and error states
 *
 * @example
 * ```typescript
 * const { messages, conversationId, isLoading, error } =
 *   useConversationHistory('ctx-work-123');
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <Error message={error.message} />;
 * return <MessageList messages={messages} />;
 * ```
 */
export function useConversationHistory(
  contextId: string
): ConversationHistoryResult {
  const { data, isLoading, error } = useQuery({
    queryKey: conversationKeys.byContext(contextId),
    queryFn: async () => {
      // Call Next.js BFF proxy (no token needed - uses session cookie)
      const response = await fetch(
        `/api/conversations?context_id=${contextId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conversation history');
      }

      const conversations = (await response.json()) as Conversation[];

      // Return most recent conversation
      if (conversations.length > 0 && conversations[0]) {
        const latest = conversations[0]; // Backend returns sorted by updated_at desc
        return {
          conversationId: latest.id,
          messages: latest.messages.slice(-50), // Last 50 messages
        };
      }

      // No conversation history
      return {
        conversationId: null,
        messages: [],
      };
    },
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: !!contextId, // Only fetch if contextId exists
  });

  return {
    messages: data?.messages ?? [],
    conversationId: data?.conversationId ?? null,
    isLoading,
    error: error as Error | null,
  };
}
