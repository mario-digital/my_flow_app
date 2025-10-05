import { toast } from 'sonner';
import type { ContextType } from '@/types/context';

/**
 * Sets the active context theme by reading from CSS custom properties
 * and updating the current context colors.
 *
 * This eliminates hardcoded color duplication - colors are defined once in
 * colors.css and read dynamically at runtime.
 *
 * @param context - The context type to activate
 *
 * @example
 * // Switch to work context (blue theme)
 * setContextTheme('work');
 *
 * @example
 * // Switch to personal context (orange theme)
 * setContextTheme('personal');
 *
 * @example
 * // Use with user preference
 * const userContext = getUserPreference();
 * setContextTheme(userContext);
 */
export function setContextTheme(context: ContextType): void {
  if (typeof document === 'undefined') return; // Guard for SSR

  const root = document.documentElement;
  const styles = getComputedStyle(root);

  // Read color values from CSS custom properties (single source of truth)
  const base = styles.getPropertyValue(`--primitive-${context}`).trim();
  const hover = styles.getPropertyValue(`--primitive-${context}-hover`).trim();
  const active = styles
    .getPropertyValue(`--primitive-${context}-active`)
    .trim();

  // Update current context colors (base, hover, active)
  root.style.setProperty('--color-context-current', base);
  root.style.setProperty('--color-context-current-hover', hover);
  root.style.setProperty('--color-context-current-active', active);

  // Add data attribute for additional CSS targeting
  root.setAttribute('data-context', context);
}

/**
 * Gets the current active context from DOM
 *
 * @example
 * // Get current context
 * const currentContext = getCurrentContext();
 * if (currentContext === 'work') {
 *   console.log('Currently in work mode');
 * }
 */
export function getCurrentContext(): ContextType | null {
  if (typeof document === 'undefined') return null;

  return document.documentElement.getAttribute(
    'data-context'
  ) as ContextType | null;
}

/**
 * Shows a toast notification when the context switches
 *
 * @param context - The new context that was activated
 *
 * @example
 * // Show notification after switching context
 * setContextTheme('personal');
 * showContextSwitchNotification('personal');
 * // Displays: "Switched to Personal context"
 *
 * @example
 * // Combined context switch with notification
 * function switchContext(newContext: ContextType) {
 *   setContextTheme(newContext);
 *   showContextSwitchNotification(newContext);
 * }
 * switchContext('work');
 */
export function showContextSwitchNotification(context: ContextType): void {
  const contextLabels: Record<ContextType, string> = {
    work: 'Work',
    personal: 'Personal',
    rest: 'Rest',
    social: 'Social',
  };

  const toastFn = toast as {
    success: (message: string, options?: { duration?: number }) => void;
  };

  toastFn.success(`Switched to ${contextLabels[context]} context`, {
    duration: 2000,
  });
}
