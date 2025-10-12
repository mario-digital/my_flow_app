import { FlowPriority } from '@/types/enums';

/**
 * Get Tailwind text color class for flow priority.
 * Uses CSS design tokens for consistent styling.
 *
 * @param priority - Flow priority level
 * @returns Tailwind text color class
 */
export function getPriorityColor(priority: FlowPriority): string {
  switch (priority) {
    case FlowPriority.High:
      return 'text-error'; // --color-error
    case FlowPriority.Medium:
      return 'text-context'; // --color-context-current
    case FlowPriority.Low:
      return 'text-text-muted'; // --color-text-muted
    default:
      return 'text-text-secondary';
  }
}

/**
 * Get Tailwind background color class for flow priority badge.
 * Uses CSS design tokens with opacity for subtle backgrounds.
 *
 * @param priority - Flow priority level
 * @returns Tailwind background color class
 */
export function getPriorityBgColor(priority: FlowPriority): string {
  switch (priority) {
    case FlowPriority.High:
      return 'bg-error/10'; // error at 10% opacity
    case FlowPriority.Medium:
      return 'bg-context/10'; // context at 10% opacity
    case FlowPriority.Low:
      return 'bg-bg-tertiary'; // --color-bg-tertiary
    default:
      return 'bg-bg-secondary';
  }
}

/**
 * Get human-readable priority label.
 *
 * @param priority - Flow priority level
 * @returns Priority label for display
 */
export function getPriorityLabel(priority: FlowPriority): string {
  switch (priority) {
    case FlowPriority.High:
      return 'High';
    case FlowPriority.Medium:
      return 'Medium';
    case FlowPriority.Low:
      return 'Low';
    default:
      return 'Unknown';
  }
}

/**
 * Truncate text to specified length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
