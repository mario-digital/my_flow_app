import { describe, it, expect, beforeEach } from 'vitest';
import {
  setContextTheme,
  getCurrentContext,
  type ContextType,
} from './context-theme';

describe('setContextTheme', () => {
  beforeEach(() => {
    // Clear all attributes and styles before each test
    document.documentElement.removeAttribute('data-context');
    document.documentElement.removeAttribute('style');
  });

  it('should update CSS custom properties when context changes', () => {
    setContextTheme('work');

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-context-current')).toBe(
      '#3B82F6'
    );
    expect(root.style.getPropertyValue('--color-context-current-hover')).toBe(
      '#60A5FA'
    );
    expect(root.style.getPropertyValue('--color-context-current-active')).toBe(
      '#93C5FD'
    );
  });

  it('should set data-context attribute', () => {
    setContextTheme('personal');

    expect(document.documentElement.getAttribute('data-context')).toBe(
      'personal'
    );
  });

  it('should handle SSR gracefully', () => {
    // Mock document as undefined to simulate SSR
    const originalDocument = global.document;
    // @ts-expect-error - Intentionally setting to undefined for SSR test
    global.document = undefined;

    // Should not throw
    expect(() => setContextTheme('work')).not.toThrow();

    // Restore document
    global.document = originalDocument;
  });

  it('should apply correct hover/active states for all contexts', () => {
    const contexts: ContextType[] = ['work', 'personal', 'rest', 'social'];
    const expectedColors = {
      work: { base: '#3B82F6', hover: '#60A5FA', active: '#93C5FD' },
      personal: { base: '#F97316', hover: '#FB923C', active: '#FDBA74' },
      rest: { base: '#A855F7', hover: '#C084FC', active: '#D8B4FE' },
      social: { base: '#10B981', hover: '#34D399', active: '#6EE7B7' },
    };

    contexts.forEach((context) => {
      setContextTheme(context);
      const root = document.documentElement;

      expect(root.style.getPropertyValue('--color-context-current')).toBe(
        expectedColors[context].base
      );
      expect(root.style.getPropertyValue('--color-context-current-hover')).toBe(
        expectedColors[context].hover
      );
      expect(
        root.style.getPropertyValue('--color-context-current-active')
      ).toBe(expectedColors[context].active);
    });
  });

  it('should update when switching between contexts', () => {
    setContextTheme('work');
    expect(document.documentElement.getAttribute('data-context')).toBe('work');

    setContextTheme('rest');
    expect(document.documentElement.getAttribute('data-context')).toBe('rest');
    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe('#A855F7');
  });
});

describe('getCurrentContext', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-context');
  });

  it('should return null when no context is set', () => {
    expect(getCurrentContext()).toBeNull();
  });

  it('should return the current context from data attribute', () => {
    setContextTheme('personal');
    expect(getCurrentContext()).toBe('personal');
  });

  it('should handle SSR gracefully', () => {
    const originalDocument = global.document;
    // @ts-expect-error - Intentionally setting to undefined for SSR test
    global.document = undefined;

    expect(getCurrentContext()).toBeNull();

    global.document = originalDocument;
  });

  it('should reflect context changes', () => {
    setContextTheme('work');
    expect(getCurrentContext()).toBe('work');

    setContextTheme('social');
    expect(getCurrentContext()).toBe('social');
  });
});
