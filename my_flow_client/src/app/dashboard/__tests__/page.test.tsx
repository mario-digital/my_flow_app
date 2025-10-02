import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../page';
import * as logtoServerActions from '@logto/next/server-actions';
import * as nextNavigation from 'next/navigation';
import type { IdTokenClaims } from '@logto/next';

vi.mock('@logto/next/server-actions');

const createMockClaims = (overrides?: Partial<IdTokenClaims>): IdTokenClaims => ({
  sub: 'user123',
  email: 'test@example.com',
  iss: 'https://logto.example.com',
  aud: 'app-id',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  ...overrides,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when not authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: false,
      claims: undefined,
    });

    const redirectSpy = vi.spyOn(nextNavigation, 'redirect');

    try {
      await DashboardPage();
    } catch (e) {
      // Expected redirect error
    }

    expect(redirectSpy).toHaveBeenCalledWith('/login');
  });

  it('should render dashboard with user info when authenticated', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: true,
      claims: createMockClaims(),
    });

    const component = await DashboardPage();
    const html = JSON.stringify(component);

    expect(html).toContain('Dashboard');
    expect(html).toContain('user123');
    expect(html).toContain('test@example.com');
  });

  it('should show "Not provided" when email is missing', async () => {
    vi.mocked(logtoServerActions.getLogtoContext).mockResolvedValue({
      isAuthenticated: true,
      claims: createMockClaims({ email: undefined }),
    });

    const component = await DashboardPage();
    const html = JSON.stringify(component);

    expect(html).toContain('Not provided');
  });
});
