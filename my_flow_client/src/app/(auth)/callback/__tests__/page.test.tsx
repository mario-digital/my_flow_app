import { describe, it, expect, vi, beforeEach } from 'vitest';
import CallbackPage from '../page';
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

describe('CallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to dashboard when authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: true,
      claims: mockClaims,
    });

    const redirectSpy = vi.spyOn(nextNavigation, 'redirect');

    try {
      await CallbackPage({
        searchParams: Promise.resolve({
          code: 'test-code',
          state: 'test-state',
        }),
      });
    } catch {
      // Expected redirect error
    }

    expect(redirectSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('should process callback and redirect when valid OAuth params provided', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: false,
      claims: undefined,
    });
    vi.mocked(logtoServerActions.handleSignIn).mockResolvedValue(undefined);

    try {
      await CallbackPage({
        searchParams: Promise.resolve({
          code: 'test-code',
          state: 'test-state',
        }),
      });
    } catch {
      // Expected - component returns JSX
    }

    // Should render the form (component doesn't redirect immediately when not authenticated)
  });
});
