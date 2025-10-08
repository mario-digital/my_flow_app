import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContextTheme } from './use-context-theme';
import { getCurrentContext } from '@/lib/context-theme';
import { ContextType } from '@/types/enums';

describe('useContextTheme', () => {
  // Mock CSS custom properties that would be defined in colors.css
  const mockCssProperties: Record<string, string> = {
    '--primitive-work': '#3B82F6',
    '--primitive-work-hover': '#60A5FA',
    '--primitive-work-active': '#93C5FD',
    '--primitive-personal': '#F97316',
    '--primitive-personal-hover': '#FB923C',
    '--primitive-personal-active': '#FDBA74',
    '--primitive-rest': '#A855F7',
    '--primitive-rest-hover': '#C084FC',
    '--primitive-rest-active': '#D8B4FE',
    '--primitive-social': '#10B981',
    '--primitive-social-hover': '#34D399',
    '--primitive-social-active': '#6EE7B7',
  };

  beforeEach(() => {
    document.documentElement.removeAttribute('data-context');
    document.documentElement.removeAttribute('style');

    // Mock getComputedStyle to return our CSS custom properties
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (prop: string) => mockCssProperties[prop] || '',
        }) as CSSStyleDeclaration
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set context theme when hook is rendered', () => {
    renderHook(() => useContextTheme(ContextType.Work));

    expect(getCurrentContext()).toBe(ContextType.Work);
    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe('#3B82F6');
  });

  it('should update context theme when context prop changes', () => {
    const { rerender } = renderHook(({ context }) => useContextTheme(context), {
      initialProps: { context: ContextType.Work },
    });

    expect(getCurrentContext()).toBe(ContextType.Work);

    rerender({ context: ContextType.Personal });

    expect(getCurrentContext()).toBe(ContextType.Personal);
    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe('#F97316');
  });

  it('should handle setting same context multiple times', () => {
    const { rerender } = renderHook(({ context }) => useContextTheme(context), {
      initialProps: { context: ContextType.Rest },
    });

    const initialColor = document.documentElement.style.getPropertyValue(
      '--color-context-current'
    );

    rerender({ context: ContextType.Rest });

    expect(
      document.documentElement.style.getPropertyValue('--color-context-current')
    ).toBe(initialColor);
  });

  it('should handle all context types', () => {
    const contexts: ContextType[] = [
      ContextType.Work,
      ContextType.Personal,
      ContextType.Rest,
      ContextType.Social,
    ];

    contexts.forEach((context) => {
      renderHook(() => useContextTheme(context));
      expect(getCurrentContext()).toBe(context);
      // Clean up for next iteration
      document.documentElement.removeAttribute('data-context');
      document.documentElement.removeAttribute('style');
    });
  });
});
