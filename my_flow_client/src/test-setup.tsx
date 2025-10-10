import { createElement } from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock CSS imports to prevent PostCSS/Tailwind errors in tests
vi.mock('./app/globals.css', () => ({}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock Logto server actions to avoid requiring real session context
vi.mock('@logto/next/server-actions', () => ({
  getAccessToken: vi.fn(async () => 'test-access-token'),
  getLogtoContext: vi.fn(async () => ({
    isAuthenticated: true,
    claims: {
      sub: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  })),
}));

// Mock Navigation component (async server component)
vi.mock('@/components/navigation', () => ({
  Navigation: () =>
    createElement('nav', { 'data-testid': 'navigation' }, 'Navigation'),
}));

// Mock Next.js fonts with proper function structure
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    className: 'geist-sans',
    variable: '--font-geist-sans',
    style: { fontFamily: 'Geist Sans' },
  })),
  Geist_Mono: vi.fn(() => ({
    className: 'geist-mono',
    variable: '--font-geist-mono',
    style: { fontFamily: 'Geist Mono' },
  })),
}));

// Mock Next.js Image component for testing
// Next.js Image component uses advanced features (lazy loading, optimization) that are
// difficult to test in jsdom. We replace it with a standard img tag for testing purposes.
vi.mock('next/image', () => ({
  default: ({
    priority: _priority,
    loader: _loader,
    fill: _fill,
    placeholder: _placeholder,
    blurDataURL: _blur,
    ...props
  }: Record<string, unknown>) => {
    // Replace Next.js Image with standard img element for testing
    // Strip Next-specific props (priority, loader, fill, etc.) so React
    // doesn't warn about unknown/dom-incompatible attributes.
    void _priority;
    void _loader;
    void _fill;
    void _placeholder;
    void _blur;
    return createElement(
      'img',
      props as React.ImgHTMLAttributes<HTMLImageElement>
    );
  },
}));

// Mock ResizeObserver for Headless UI
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
