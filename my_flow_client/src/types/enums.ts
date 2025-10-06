/**
 * Centralized TypeScript Enums
 *
 * All fixed value sets must use enums per coding standards Section 7.
 * Enum values must match backend Python enums exactly for API consistency.
 */

/**
 * Context type categories.
 * Must match backend ContextType values for API consistency.
 *
 * @see docs/architecture/data-models.md#context-model
 */
export enum ContextType {
  Work = 'work',
  Personal = 'personal',
  Rest = 'rest',
  Social = 'social',
}

/**
 * Flow priority levels.
 * Must match backend FlowPriority enum exactly.
 *
 * @see docs/architecture/data-models.md#flow-model
 */
export enum FlowPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

/**
 * Flow status indicators based on due date.
 * Must match backend FlowStatus enum exactly.
 *
 * @see docs/architecture/data-models.md#flow-model
 */
export enum FlowStatus {
  Overdue = 'overdue',
  DueToday = 'due_today',
  DueSoon = 'due_soon',
  Normal = 'normal',
}

/**
 * Context switch modes for AI-powered context suggestions.
 * Determines how aggressively to auto-switch contexts.
 *
 * @see docs/architecture/data-models.md#ai-context
 */
export enum ContextSwitchMode {
  Manual = 'manual',
  Suggest = 'suggest',
  Auto = 'auto',
}
