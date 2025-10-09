/**
 * Centralized toast messages for flow operations.
 *
 * This module provides consistent user-facing messages for all flow-related
 * CRUD operations. By centralizing these messages:
 * - Ensures consistency across the application
 * - Makes i18n integration easier (future: wrap with translation helper)
 * - Prevents hardcoded strings in hooks/components
 * - Provides fallback messages when transformError returns undefined
 *
 * Usage:
 * ```typescript
 * import { FLOW_MESSAGES } from '@/lib/messages/flows';
 *
 * toast.error(appError.userMessage ?? FLOW_MESSAGES.createError);
 * toast.success(FLOW_MESSAGES.createSuccess);
 * ```
 */
export const FLOW_MESSAGES = {
  // Query error messages
  fetchListError: 'Failed to load flows',
  fetchDetailError: 'Failed to load flow details',

  // Mutation success messages
  createSuccess: 'Flow created successfully',
  updateSuccess: 'Flow updated successfully',
  deleteSuccess: 'Flow deleted successfully',
  completeSuccess: 'Flow completion toggled successfully',

  // Mutation error messages
  createError: 'Failed to create flow',
  updateError: 'Failed to update flow',
  deleteError: 'Failed to delete flow',
  completeError: 'Failed to toggle flow completion',
} as const;

export type FlowMessageKey = keyof typeof FLOW_MESSAGES;
