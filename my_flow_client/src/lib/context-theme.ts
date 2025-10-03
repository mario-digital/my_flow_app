export type ContextType = 'work' | 'personal' | 'rest' | 'social';

interface ContextColorSet {
  base: string;
  hover: string;
  active: string;
}

const CONTEXT_COLORS: Record<ContextType, ContextColorSet> = {
  work: {
    base: '#3B82F6',
    hover: '#60A5FA',
    active: '#93C5FD',
  },
  personal: {
    base: '#F97316',
    hover: '#FB923C',
    active: '#FDBA74',
  },
  rest: {
    base: '#A855F7',
    hover: '#C084FC',
    active: '#D8B4FE',
  },
  social: {
    base: '#10B981',
    hover: '#34D399',
    active: '#6EE7B7',
  },
};

/**
 * Sets the active context theme by updating CSS custom properties
 * @param context - The context type to activate
 */
export function setContextTheme(context: ContextType): void {
  if (typeof document === 'undefined') return; // Guard for SSR

  const root = document.documentElement;
  const colors = CONTEXT_COLORS[context];

  // Update current context colors (base, hover, active)
  root.style.setProperty('--color-context-current', colors.base);
  root.style.setProperty('--color-context-current-hover', colors.hover);
  root.style.setProperty('--color-context-current-active', colors.active);

  // Optional: Add data attribute for additional CSS targeting
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
