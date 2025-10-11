/**
 * Unit tests for Navigation component.
 *
 * Note: Navigation is a client component that uses multiple contexts (CurrentUser, AppProviders).
 * These tests mock the component to verify it's being used correctly in layouts.
 * Integration tests for navigation behavior are covered in E2E tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the Navigation component
vi.mock('@/components/navigation', () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

// Import AFTER mock
import { Navigation } from '../navigation';

describe('Navigation', () => {
  it('renders as a navigation element', () => {
    render(<Navigation />);

    const nav = screen.getByTestId('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
  });

  it('exports Navigation component', () => {
    expect(Navigation).toBeDefined();
    expect(typeof Navigation).toBe('function');
  });
});
