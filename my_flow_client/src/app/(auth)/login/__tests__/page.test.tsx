import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../page';
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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call redirect when authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: true,
      claims: mockClaims,
    });

    const redirectSpy = vi.spyOn(nextNavigation, 'redirect');

    try {
      await LoginPage();
    } catch (e) {
      // Expected redirect error
    }

    expect(redirectSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('should render login page when not authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: false,
      claims: undefined,
    });

    const component = await LoginPage();
    const html = JSON.stringify(component);

    expect(html).toContain('Welcome to MyFlow');
    expect(html).toContain('Sign in to continue');
  });
});
