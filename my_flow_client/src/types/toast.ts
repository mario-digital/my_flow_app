/**
 * Toast notification type definitions
 *
 * Re-exports types from sonner for type-safe toast notifications
 * throughout the application.
 */

import type { ExternalToast } from 'sonner';

/**
 * Options for toast notifications
 *
 * @example
 * const options: ToastOptions = {
 *   duration: 2000,
 *   description: 'Context switched successfully'
 * };
 */
export type ToastOptions = ExternalToast;

/**
 * Toast message content type
 * Can be a string or React node
 */
export type ToastMessage = string | React.ReactNode;
