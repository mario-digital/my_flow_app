import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Use the real Navigation component instead of the global mock from test-setup
vi.unmock('@/components/navigation');

const mockUseCurrentUser = vi.fn();
vi.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const mockUseContexts = vi.fn();
vi.mock('@/hooks/use-contexts', () => ({
  useContexts: () => mockUseContexts(),
}));

const mockUseCurrentContext = vi.fn();
vi.mock('@/components/providers/app-providers', () => ({
  useCurrentContext: () => mockUseCurrentContext(),
}));

const mockSignOut = vi.fn();
vi.mock('@/lib/actions/auth', () => ({
  signOut: mockSignOut,
}));

const contextSwitcherMock = vi.fn(
  ({ currentContextId }: { currentContextId: string }) => (
    <div data-testid="context-switcher">Current: {currentContextId}</div>
  )
);

vi.mock('@/components/contexts/context-switcher', () => ({
  ContextSwitcher: contextSwitcherMock,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...rest}>
      {children as ReactNode}
    </button>
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContexts.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    mockUseCurrentContext.mockReturnValue({
      currentContextId: null,
      setCurrentContextId: vi.fn(),
    });
  });

  it('shows sign-in link when user is not authenticated', async () => {
    mockUseCurrentUser.mockReturnValue({
      userId: null,
      email: null,
      name: null,
      claims: null,
      isAuthenticated: false,
      isLoading: false,
    });

    const { Navigation } = await import('@/components/navigation');

    render(<Navigation />);

    expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    expect(contextSwitcherMock).not.toHaveBeenCalled();
  });

  it('renders context switcher and sign-out form for authenticated users', async () => {
    const setCurrentContextId = vi.fn();
    mockUseCurrentUser.mockReturnValue({
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      claims: null,
      isAuthenticated: true,
      isLoading: false,
    });

    const contexts = [
      { id: 'ctx-1', name: 'Project A' },
      { id: 'ctx-2', name: 'Project B' },
    ] as Array<{ id: string; name: string }>;

    mockUseContexts.mockReturnValue({
      data: contexts,
      isLoading: false,
    });

    mockUseCurrentContext.mockReturnValue({
      currentContextId: 'ctx-2',
      setCurrentContextId,
    });

    const { Navigation } = await import('@/components/navigation');

    render(<Navigation />);

    expect(screen.getByAltText('MyFlow')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign Out' })
    ).toBeInTheDocument();
    expect(contextSwitcherMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currentContextId: 'ctx-2',
        contexts,
        onContextChange: setCurrentContextId,
      }),
      undefined
    );
  });
});
