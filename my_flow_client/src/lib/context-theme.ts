export type ContextType = 'work' | 'personal' | 'rest' | 'social';

/**
 * Sets the active context theme by reading from CSS custom properties
 * and updating the current context colors.
 *
 * This eliminates hardcoded color duplication - colors are defined once in
 * colors.css and read dynamically at runtime.
 *
 * @param context - The context type to activate
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
 */
export function getCurrentContext(): ContextType | null {
  if (typeof document === 'undefined') return null;

  return document.documentElement.getAttribute(
    'data-context'
  ) as ContextType | null;
}
