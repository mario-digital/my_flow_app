import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  usePreferences,
  useUpdatePreferences,
  useMarkOnboardingComplete,
  useSetCurrentContext,
} from '../use-preferences';
import * as preferencesApi from '@/lib/api/preferences';

// Mock the API functions
vi.mock('@/lib/api/preferences', () => ({
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  markOnboardingComplete: vi.fn(),
  setCurrentContext: vi.fn(),
}));

// Mock useCurrentUser hook
vi.mock('../use-current-user', () => ({
  useCurrentUser: () => ({
    userId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return Wrapper;
}

describe('usePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user preferences successfully', async () => {
    const mockPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: false,
      onboarding_completed_at: null,
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(mockPreferences);

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPreferences);
    expect(preferencesApi.getPreferences).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error gracefully', async () => {
    vi.mocked(preferencesApi.getPreferences).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => usePreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('useUpdatePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates preferences successfully', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: false,
      onboarding_completed_at: null,
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPreferences = {
      ...initialPreferences,
      theme: 'dark' as const,
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.updatePreferences).mockResolvedValue(
      updatedPreferences
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then update
    const { result: updateResult } = renderHook(() => useUpdatePreferences(), {
      wrapper,
    });

    updateResult.current.mutate({ theme: 'dark' });

    await waitFor(() => {
      expect(updateResult.current.isSuccess).toBe(true);
    });

    expect(preferencesApi.updatePreferences).toHaveBeenCalledWith({
      theme: 'dark',
    });
  });

  it('handles update error with rollback', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: false,
      onboarding_completed_at: null,
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.updatePreferences).mockRejectedValue(
      new Error('Update failed')
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then attempt update
    const { result: updateResult } = renderHook(() => useUpdatePreferences(), {
      wrapper,
    });

    updateResult.current.mutate({ theme: 'dark' });

    await waitFor(() => {
      expect(updateResult.current.isError).toBe(true);
    });

    expect(updateResult.current.error?.message).toBe('Update failed');
  });
});

describe('useMarkOnboardingComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks onboarding as complete successfully', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: false,
      onboarding_completed_at: null,
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const completedPreferences = {
      ...initialPreferences,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.markOnboardingComplete).mockResolvedValue(
      completedPreferences
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then mark complete
    const { result: completeResult } = renderHook(
      () => useMarkOnboardingComplete(),
      { wrapper }
    );

    completeResult.current.mutate();

    await waitFor(() => {
      expect(completeResult.current.isSuccess).toBe(true);
    });

    expect(preferencesApi.markOnboardingComplete).toHaveBeenCalledTimes(1);
  });

  it('handles marking complete error', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: false,
      onboarding_completed_at: null,
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.markOnboardingComplete).mockRejectedValue(
      new Error('Failed to complete')
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then attempt to mark complete
    const { result: completeResult } = renderHook(
      () => useMarkOnboardingComplete(),
      { wrapper }
    );

    completeResult.current.mutate();

    await waitFor(() => {
      expect(completeResult.current.isError).toBe(true);
    });

    expect(completeResult.current.error?.message).toBe('Failed to complete');
  });
});

describe('useSetCurrentContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets current context successfully', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPreferences = {
      ...initialPreferences,
      current_context_id: 'context-123',
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.setCurrentContext).mockResolvedValue(
      updatedPreferences
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then set context
    const { result: setContextResult } = renderHook(
      () => useSetCurrentContext(),
      { wrapper }
    );

    setContextResult.current.mutate('context-123');

    await waitFor(() => {
      expect(setContextResult.current.isSuccess).toBe(true);
    });

    expect(preferencesApi.setCurrentContext).toHaveBeenCalledWith(
      'context-123'
    );
  });

  it('clears current context successfully', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      current_context_id: 'context-123',
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPreferences = {
      ...initialPreferences,
      current_context_id: null,
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.setCurrentContext).mockResolvedValue(
      updatedPreferences
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then clear context
    const { result: setContextResult } = renderHook(
      () => useSetCurrentContext(),
      { wrapper }
    );

    setContextResult.current.mutate(null);

    await waitFor(() => {
      expect(setContextResult.current.isSuccess).toBe(true);
    });

    expect(preferencesApi.setCurrentContext).toHaveBeenCalledWith(null);
  });

  it('handles set context error with rollback', async () => {
    const initialPreferences = {
      id: '1',
      user_id: 'test-user',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      current_context_id: null,
      theme: null,
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      initialPreferences
    );
    vi.mocked(preferencesApi.setCurrentContext).mockRejectedValue(
      new Error('Failed to set context')
    );

    const wrapper = createWrapper();

    // First fetch initial preferences
    const { result: prefResult } = renderHook(() => usePreferences(), {
      wrapper,
    });

    await waitFor(() => {
      expect(prefResult.current.isSuccess).toBe(true);
    });

    // Then attempt to set context
    const { result: setContextResult } = renderHook(
      () => useSetCurrentContext(),
      { wrapper }
    );

    setContextResult.current.mutate('context-123');

    await waitFor(() => {
      expect(setContextResult.current.isError).toBe(true);
    });

    expect(setContextResult.current.error?.message).toBe(
      'Failed to set context'
    );
  });
});
