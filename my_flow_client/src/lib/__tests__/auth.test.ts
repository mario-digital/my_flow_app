import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../auth';
import * as logtoServerActions from '@logto/next/server-actions';
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

describe('requireAuth', () => {
  it('should redirect to login when not authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: false,
      claims: undefined,
    });

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('should return claims when authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: true,
      claims: mockClaims,
    });

    const result = await requireAuth();
    expect(result).toEqual(mockClaims);
  });
});
