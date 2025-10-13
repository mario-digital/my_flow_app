import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnboarding } from '../use-onboarding';

// Mock useContexts hook
vi.mock('../use-contexts', () => ({
  useContexts: vi.fn(),
}));

import { useContexts } from '../use-contexts';

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
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('shows onboarding if user has 0 contexts and has not seen it', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

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

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isOpen).toBe(false);
  });

  it('does not show if user has seen it before', async () => {
    localStorage.setItem('has_seen_onboarding', 'true');

    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

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

  it('handleClose() closes modal and marks as seen', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    // Close modal
    act(() => {
      result.current.handleClose();
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem('has_seen_onboarding')).toBe('true');
  });

  it('handleComplete() closes modal, marks as seen, and reloads page', async () => {
    vi.mocked(useContexts).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useContexts>);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    // Complete onboarding
    act(() => {
      result.current.handleComplete();
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem('has_seen_onboarding')).toBe('true');
    expect(window.location.reload).toHaveBeenCalled();
  });
});
