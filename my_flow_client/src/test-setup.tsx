import React from 'react';
import { vi } from 'vitest';

// Mock CSS imports to prevent PostCSS/Tailwind errors in tests
vi.mock('./app/globals.css', () => ({}));

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
