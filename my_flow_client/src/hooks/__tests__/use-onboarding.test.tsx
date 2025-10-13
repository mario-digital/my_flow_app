import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnboarding } from '../use-onboarding';

// Mock useContexts hook
vi.mock('../use-contexts', () => ({
  useContexts: vi.fn(),
}));

// Mock usePreferences hook
vi.mock('../use-preferences', () => ({
  usePreferences: vi.fn(),
  useMarkOnboardingComplete: vi.fn(),
}));

import { useContexts } from '../use-contexts';
import { usePreferences, useMarkOnboardingComplete } from '../use-preferences';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location.reload
delete (window as unknown as Record<string, unknown>)['location'];
(window as unknown as Record<string, unknown>)['location'] = {
  reload: vi.fn(),
} as unknown as Location;

describe('useOnboarding', () => {
  const mockMarkCompleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Mock useMarkOnboardingComplete with a mutation function
    vi.mocked(useMarkOnboardingComplete).mockReturnValue({
      mutate: mockMarkCompleteMutate,
    } as unknown as ReturnType<typeof useMarkOnboardingComplete>);
  });

  it('shows onboarding if user has 0 contexts and has not completed onboarding', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

    vi.mocked(usePreferences).mockReturnValue({
      data: {
        id: '1',
        user_id: 'user1',
        onboarding_completed: false,
        onboarding_completed_at: null,
        current_context_id: null,
        theme: null,
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof usePreferences>);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });
  });

  it('does not show if user has contexts', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Work',
          icon: '💼',
          color: '#3b82f6',
          user_id: 'user1',
          created_at: '',
          updated_at: '',
        },
      ],
    } as ReturnType<typeof useContexts>);

    vi.mocked(usePreferences).mockReturnValue({
      data: {
        id: '1',
        user_id: 'user1',
        onboarding_completed: false,
        onboarding_completed_at: null,
        current_context_id: null,
        theme: null,
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof usePreferences>);

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isOpen).toBe(false);
  });

  it('does not show if user has completed onboarding', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

    vi.mocked(usePreferences).mockReturnValue({
      data: {
        id: '1',
        user_id: 'user1',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        current_context_id: null,
        theme: null,
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof usePreferences>);

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isOpen).toBe(false);
  });

  it('triggerManually() opens modal', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Work',
          icon: '💼',
          color: '#3b82f6',
          user_id: 'user1',
          created_at: '',
          updated_at: '',
        },
      ],
    } as ReturnType<typeof useContexts>);

    vi.mocked(usePreferences).mockReturnValue({
      data: {
        id: '1',
        user_id: 'user1',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        current_context_id: null,
        theme: null,
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof usePreferences>);

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isOpen).toBe(false);

    // Trigger manually
    act(() => {
      result.current.triggerManually();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });
  });

  it('handleClose() closes modal and marks as completed in DB', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

    vi.mocked(usePreferences).mockReturnValue({
      data: {
        id: '1',
        user_id: 'user1',
        onboarding_completed: false,
        onboarding_completed_at: null,
        current_context_id: null,
        theme: null,
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof usePreferences>);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    // Close modal
    act(() => {
      result.current.handleClose();
    });

    expect(result.current.isOpen).toBe(false);
    expect(mockMarkCompleteMutate).toHaveBeenCalled();
  });

  it('handleComplete() closes modal, marks as completed in DB, and reloads page', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

    vi.mocked(usePreferences).mockReturnValue({
      data: {
        id: '1',
        user_id: 'user1',
        onboarding_completed: false,
        onboarding_completed_at: null,
        current_context_id: null,
        theme: null,
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } as unknown as ReturnType<typeof usePreferences>);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    // Complete onboarding
    act(() => {
      result.current.handleComplete();
    });

    expect(result.current.isOpen).toBe(false);
    expect(mockMarkCompleteMutate).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
