/**
 * Unit tests for home page component.
 * Home page now redirects to /login or /dashboard based on auth status.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import * as logtoServerActions from '@logto/next/server-actions';
import * as nextNavigation from 'next/navigation';
import type { IdTokenClaims } from '@logto/next';

vi.mock('@logto/next/server-actions');

const mockClaims: IdTokenClaims = {
  sub: 'user123',
  email: 'test@example.com',
  iss: 'https://logto.example.com',
  aud: 'app-id',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to dashboard when authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: true,
      claims: mockClaims,
    });

    const redirectSpy = vi.spyOn(nextNavigation, 'redirect');

    try {
      await Home();
    } catch {
      // Expected redirect error
    }

    expect(redirectSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to login when not authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: false,
      claims: undefined,
    });

    const redirectSpy = vi.spyOn(nextNavigation, 'redirect');

    try {
      await Home();
    } catch {
      // Expected redirect error
    }

    expect(redirectSpy).toHaveBeenCalledWith('/login');
  });
});
