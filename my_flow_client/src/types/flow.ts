import { FlowPriority } from './enums';

/**
 * Flow (Task) data model.
 * Matches backend Flow Pydantic model from Epic 2.
 *
 * @see docs/architecture/data-models.md#flow-model
 */
export interface Flow {
  /** Unique flow identifier (MongoDB ObjectId as string) */
  id: string;

  /** Context this flow belongs to */
  context_id: string;

  /** User who owns this flow */
  user_id: string;

  /** Flow title (1-200 characters) */
  title: string;

  /** Optional detailed description */
  description?: string;

  /** Priority level (low, medium, high) */
  priority: FlowPriority;

  /** Completion status */
  is_completed: boolean;

  /** Optional due date (ISO 8601 format) */
  due_date?: string;

  /** Whether reminder is enabled */
  reminder_enabled: boolean;

  /** Creation timestamp (ISO 8601 format) */
  created_at: string;

  /** Last update timestamp (ISO 8601 format) */
  updated_at: string;

  /** Completion timestamp (ISO 8601 format, only set if is_completed=true) */
  completed_at?: string;
}
