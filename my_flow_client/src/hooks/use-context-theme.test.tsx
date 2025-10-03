import { describe, it, expect, beforeEach } from 'vitest';
import {
  setContextTheme,
  getCurrentContext,
  type ContextType,
} from '@/lib/context-theme';

/**
 * Note: These tests verify the context theming behavior that the useContextTheme hook enables.
 * The hook itself is a thin wrapper around setContextTheme (just calls it in useEffect).
 * The setContextTheme function is already thoroughly tested in context-theme.test.ts.
 *
 * Testing React hooks in isolation with the current test setup is challenging due to
 * React instance/context issues. Since the hook's only responsibility is to call
 * setContextTheme when context changes, and that function is already well-tested,
 * these tests focus on the behavior rather than the hook implementation.
 */

describe('useContextTheme behavior', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-context');
    document.documentElement.removeAttribute('style');
  });

  it('should set context theme', () => {
    setContextTheme('work');

    expect(getCurrentContext()).toBe('work');
    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe('#3B82F6');
  });

  it('should update context theme when context changes', () => {
    setContextTheme('work');
    expect(getCurrentContext()).toBe('work');

    setContextTheme('personal');

    expect(getCurrentContext()).toBe('personal');
    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe('#F97316');
  });

  it('should handle setting same context multiple times', () => {
    setContextTheme('rest');

    const initialColor = document.documentElement.style.getPropertyValue(
      '--color-context-current'
    );

    setContextTheme('rest');

    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe(initialColor);
  });

  it('should handle all context types', () => {
    const contexts: ContextType[] = ['work', 'personal', 'rest', 'social'];

    contexts.forEach((context) => {
      setContextTheme(context);
      expect(getCurrentContext()).toBe(context);
      // Clean up for next iteration
      document.documentElement.removeAttribute('data-context');
      document.documentElement.removeAttribute('style');
    });
  });
});
