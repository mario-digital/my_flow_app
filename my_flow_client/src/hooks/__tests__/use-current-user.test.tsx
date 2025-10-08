import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  CurrentUserProvider,
  useCurrentUser,
  type CurrentUserState,
} from '../use-current-user';

describe('useCurrentUser()', () => {
  it('returns provided context values', () => {
    const mockUserState: CurrentUserState = {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      claims: null,
      isAuthenticated: true,
      isLoading: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrentUserProvider value={mockUserState}>
        {children}
      </CurrentUserProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.userId).toBe('test-user-123');
    expect(result.current.email).toBe('test@example.com');
    expect(result.current.name).toBe('Test User');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes authenticated state with correct claims snapshot', () => {
    const mockUserState: CurrentUserState = {
      userId: 'authenticated-user',
      email: 'auth@example.com',
      name: 'Authenticated User',
      claims: null,
      isAuthenticated: true,
      isLoading: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrentUserProvider value={mockUserState}>
        {children}
      </CurrentUserProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('authenticated-user');
    expect(result.current.claims).toBeDefined();
  });

  it('throws helpful error when called outside provider', () => {
    expect(() => {
      renderHook(() => useCurrentUser());
    }).toThrow(
      'useCurrentUser must be used within CurrentUserProvider (wrap app in CurrentUserServerProvider).'
    );
  });

  it('normalizes unauthenticated session to null user', () => {
    const mockUserState: CurrentUserState = {
      userId: null,
      isAuthenticated: false,
      isLoading: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrentUserProvider value={mockUserState}>
        {children}
      </CurrentUserProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.userId).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.email).toBeUndefined();
    expect(result.current.name).toBeUndefined();
  });
});
