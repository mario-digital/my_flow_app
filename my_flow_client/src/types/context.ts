/**
 * Context Types
 * Centralized type definitions for MyFlow context system
 */

// Re-export ContextType enum from centralized enums file
export { ContextType } from './enums';

/**
 * Context data model.
 * Represents a user's context for organizing flows (e.g., Work, Personal, Rest, Social).
 *
 * @see docs/architecture/data-models.md#context-model
 */
export interface Context {
  /** MongoDB ObjectId */
  id: string;
  /** Logto user ID */
  user_id: string;
  /** Display name (1-50 chars) */
  name: string;
  /** Hex color (#RRGGBB) */
  color: string;
  /** Emoji character */
  icon: string;
  /** ISO 8601 datetime */
  created_at: string;
  /** ISO 8601 datetime */
  updated_at: string;
}
