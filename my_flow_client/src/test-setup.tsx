import '@testing-library/dom';
import { vi } from 'vitest';

// Mock Next.js Image component for testing
// Next.js Image component uses advanced features (lazy loading, optimization) that are
// difficult to test in jsdom. We replace it with a standard img tag for testing purposes.
vi.mock('next/image', () => ({
  default: (props: any) => {
    // Disable ESLint rules:
    // - @next/next/no-img-element: We intentionally use img instead of Next.js Image in tests
    // - jsx-a11y/alt-text: Test props may not always include alt text
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));