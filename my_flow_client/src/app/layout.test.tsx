/**
 * Unit tests for root layout component.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/components/providers/current-user-provider', () => ({
  CurrentUserServerProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@/components/navigation', () => ({
  Navigation: () => <nav data-testid="navigation" />,
}));

vi.mock('@/components/onboarding/onboarding-wrapper', () => ({
  OnboardingWrapper: () => <div data-testid="onboarding-wrapper" />,
}));

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

import RootLayout from './layout';

async function renderRoot(children: ReactNode) {
  const element = await RootLayout({ children });
  const markup = renderToStaticMarkup(element);
  const parser = new DOMParser();
  return parser.parseFromString(markup, 'text/html');
}

describe('RootLayout', () => {
  it('renders children correctly', async () => {
    const doc = await renderRoot(
      <div data-testid="test-child">Test Content</div>
    );

    const child = doc.querySelector('[data-testid="test-child"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe('Test Content');
  });

  it('renders as a function component', async () => {
    const doc = await renderRoot(<div>Test</div>);

    expect(doc.documentElement).toBeDefined();
  });

  it('accepts React node children', async () => {
    const doc = await renderRoot(
      <main>
        <h1>Main Content</h1>
        <p>Paragraph</p>
      </main>
    );

    expect(doc.body.querySelector('h1')?.textContent).toBe('Main Content');
    expect(doc.body.querySelector('p')?.textContent).toBe('Paragraph');
  });
});
