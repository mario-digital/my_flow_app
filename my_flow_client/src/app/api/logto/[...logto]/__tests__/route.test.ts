import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';
import * as logtoServerActions from '@logto/next/server-actions';
import * as nextNavigation from 'next/navigation';
import { NextRequest } from 'next/server';

vi.mock('@logto/next/server-actions');

describe('Logto Route Handler', () => {
  it('should handle sign in and redirect', async () => {
    const mockSearchParams = new URLSearchParams('code=123&state=456');
    const mockRequest = {
      nextUrl: { searchParams: mockSearchParams },
    } as NextRequest;

    vi.mocked(logtoServerActions.handleSignIn).mockResolvedValue(undefined);
    const redirectSpy = vi.spyOn(nextNavigation, 'redirect');

    try {
      await GET(mockRequest);
    } catch (e) {
      // Expected redirect error
    }

    expect(logtoServerActions.handleSignIn).toHaveBeenCalledWith(
      expect.anything(),
      mockSearchParams
    );
    expect(redirectSpy).toHaveBeenCalledWith('/');
  });
});
