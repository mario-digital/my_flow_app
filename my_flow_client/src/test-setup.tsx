import React from 'react';
import { vi } from 'vitest';

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

// Mock Navigation component (async server component)
vi.mock('@/components/navigation', () => ({
  Navigation: () => React.createElement('nav', { 'data-testid': 'navigation' }, 'Navigation'),
}));

// Mock Next.js fonts
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

// Mock Next.js Image component for testing
// Next.js Image component uses advanced features (lazy loading, optimization) that are
// difficult to test in jsdom. We replace it with a standard img tag for testing purposes.
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // Replace Next.js Image with standard img element for testing
    // (lazy loading and optimization features don't work in jsdom)
    return React.createElement('img', props);
  },
}));
