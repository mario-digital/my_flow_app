/**
 * Centralized toast messages for context operations.
 *
 * This module provides consistent user-facing messages for all context-related
 * CRUD operations. By centralizing these messages:
 * - Ensures consistency across the application
 * - Makes i18n integration easier (future: wrap with translation helper)
 * - Prevents hardcoded strings in hooks/components
 * - Provides fallback messages when transformError returns undefined
 *
 * Usage:
 * ```typescript
 * import { CONTEXT_MESSAGES } from '@/lib/messages/contexts';
 *
 * toast.error(appError.userMessage ?? CONTEXT_MESSAGES.createError);
 * toast.success(CONTEXT_MESSAGES.createSuccess);
 * ```
 */
export const CONTEXT_MESSAGES = {
  // Query error messages
  fetchListError: 'Failed to load contexts',
  fetchDetailError: 'Failed to load context details',

  // Mutation success messages
  createSuccess: 'Context created successfully',
  updateSuccess: 'Context updated successfully',
  deleteSuccess: 'Context deleted successfully',

  // Mutation error messages
  createError: 'Failed to create context',
  updateError: 'Failed to update context',
  deleteError: 'Failed to delete context',
} as const;

export type ContextMessageKey = keyof typeof CONTEXT_MESSAGES;
