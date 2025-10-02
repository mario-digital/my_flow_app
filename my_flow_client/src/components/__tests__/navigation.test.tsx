import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as logtoServerActions from '@logto/next/server-actions';
import type { IdTokenClaims } from '@logto/next';

// Unmock the Navigation component for this test file (test-setup.tsx mocks it globally)
vi.unmock('@/components/navigation');

// Mock Logto server actions
vi.mock('@logto/next/server-actions');
vi.mock('@/lib/logto');
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

type NavigationModule = typeof import('../navigation');
let Navigation!: NavigationModule['Navigation'];

beforeAll(async () => {
  ({ Navigation } = await import('../navigation'));
});

const mockClaimsWithEmail: IdTokenClaims = {
  sub: 'user-123',
  email: 'test@example.com',
  iss: 'https://test.logto.app',
  aud: 'test-app-id',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

const mockClaimsWithoutEmail: IdTokenClaims = {
  sub: 'user-123',
  iss: 'https://test.logto.app',
  aud: 'test-app-id',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('should show Sign In button', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: false,
        claims: undefined,
      });

      const component = await Navigation();
      render(component);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should link to /login page', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: false,
        claims: undefined,
      });

      const component = await Navigation();
      render(component);

      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should not show email or Sign Out button', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: false,
        claims: undefined,
      });

      const component = await Navigation();
      render(component);

      expect(
        screen.queryByRole('button', { name: /sign out/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/test@example\.com/)).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    it('should show user email', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithEmail,
      });

      const component = await Navigation();
      render(component);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show Sign Out button', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithEmail,
      });

      const component = await Navigation();
      render(component);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInstanceOf(HTMLButtonElement);
      expect(signOutButton).toHaveAttribute('type', 'submit');
    });

    it('should not show Sign In link', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithEmail,
      });

      const component = await Navigation();
      render(component);

      expect(
        screen.queryByRole('link', { name: /sign in/i })
      ).not.toBeInTheDocument();
    });

    it('should render Sign Out button inside a form', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithEmail,
      });

      const component = await Navigation();
      render(component);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      const form = signOutButton.closest('form');
      expect(form).toBeInstanceOf(HTMLFormElement);
    });
  });

  describe('when user is authenticated but email is missing', () => {
    it('should handle missing email gracefully', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithoutEmail,
      });

      const component = await Navigation();
      render(component);

      // Should still show Sign Out button
      expect(
        screen.getByRole('button', { name: /sign out/i })
      ).toBeInTheDocument();

      // Email should not cause a crash
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('branding', () => {
    it('should always show MyFlow logo link when not authenticated', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: false,
        claims: undefined,
      });

      const component = await Navigation();
      render(component);

      const logoLink = screen.getByRole('link', { name: /myflow/i });
      expect(logoLink).toHaveAttribute('href', '/');
      expect(logoLink).toHaveTextContent('MyFlow');
    });

    it('should show logo when authenticated', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithEmail,
      });

      const component = await Navigation();
      render(component);

      const logoLink = screen.getByRole('link', { name: /myflow/i });
      expect(logoLink).toHaveAttribute('href', '/');
      expect(logoLink).toBeInTheDocument();
    });
  });

  describe('layout and structure', () => {
    it('should render navigation with correct semantic structure', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: false,
        claims: undefined,
      });

      const component = await Navigation();
      const { container } = render(component);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('border-b');
    });

    it('should have correct container layout', async () => {
      vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
        isAuthenticated: true,
        claims: mockClaimsWithEmail,
      });

      const component = await Navigation();
      const { container } = render(component);

      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toBeInTheDocument();
      expect(containerDiv).toHaveClass('mx-auto', 'flex', 'h-16');
    });
  });
});
