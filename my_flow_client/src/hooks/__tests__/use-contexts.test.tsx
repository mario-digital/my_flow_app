import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockContexts } from '@/mocks/handlers';
import { toast } from 'sonner';
import {
  useContexts,
  useContext,
  useCreateContext,
  useUpdateContext,
  useDeleteContext,
} from '../use-contexts';
import {
  CurrentUserProvider,
  type CurrentUserState,
} from '../use-current-user';
import { CONTEXT_MESSAGES } from '@/lib/messages/contexts';
import { ReactNode } from 'react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Set up MSW server
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  resetMockContexts();
  vi.clearAllMocks();
});
afterAll(() => {
  vi.restoreAllMocks();
  server.close();
});

// Test wrapper with QueryClientProvider and CurrentUserProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 10 * 60 * 1000, // mirror list gcTime; detail queries override individually
      },
      mutations: { retry: false },
    },
  });

  const mockUserState: CurrentUserState = {
    userId: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    claims: null,
    isAuthenticated: true,
    isLoading: false,
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CurrentUserProvider value={mockUserState}>
          {children}
        </CurrentUserProvider>
      </QueryClientProvider>
    );
  }

  return Wrapper;
};

describe('useContexts()', () => {
  it('successfully fetches contexts', async () => {
    const { result } = renderHook(() => useContexts(), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0]?.name).toBe('Work');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('throws when unauthenticated', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const unauthenticatedUser: CurrentUserState = {
      userId: null,
      isAuthenticated: false,
      isLoading: false,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <CurrentUserProvider value={unauthenticatedUser}>
          {children}
        </CurrentUserProvider>
      </QueryClientProvider>
    );

    expect(() => {
      renderHook(() => useContexts(), { wrapper });
    }).toThrow('useContexts requires an authenticated user');
  });

  it('handles fetch error', async () => {
    // Override handler to return 500 error
    server.use(
      http.get('*/api/v1/contexts', () => {
        return HttpResponse.json(
          { detail: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useContexts(), {
      wrapper: createWrapper(),
    });

    // Wait for error state
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert error is defined
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('handles 401 by surfacing error', async () => {
    // Override handler to return 401
    server.use(
      http.get('*/api/v1/contexts', () => {
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useContexts(), {
      wrapper: createWrapper(),
    });

    // Wait for error state
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert error is defined
    expect(result.current.error).toBeDefined();
  });
});

describe('useContext(id)', () => {
  it('fetches single context by ID', async () => {
    const { result } = renderHook(
      () => useContext('507f1f77bcf86cd799439011'),
      {
        wrapper: createWrapper(),
      }
    );

    // Wait for loading to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert data matches expected context
    expect(result.current.data?.name).toBe('Work');
    expect(result.current.data?.id).toBe('507f1f77bcf86cd799439011');
    expect(result.current.error).toBe(null);
  });

  it('handles 404 not found', async () => {
    const { result } = renderHook(() => useContext('non-existent-id'), {
      wrapper: createWrapper(),
    });

    // Wait for success (returns null, not error)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert returns null for 404
    expect(result.current.data).toBe(null);
  });

  it('handles 401 unauthorized', async () => {
    // Override handler to return 401
    server.use(
      http.get('*/api/v1/contexts/:id', () => {
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
      })
    );

    const { result } = renderHook(
      () => useContext('507f1f77bcf86cd799439011'),
      {
        wrapper: createWrapper(),
      }
    );

    // Wait for error state
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert error is defined
    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateContext()', () => {
  it('creates context with optimistic update', async () => {
    // Render both query and mutation hooks in a SINGLE renderHook with shared QueryClient
    const { result } = renderHook(
      () => ({
        contexts: useContexts(),
        createContext: useCreateContext(),
      }),
      { wrapper: createWrapper() }
    );

    // Wait for initial data
    await waitFor(() => expect(result.current.contexts.isSuccess).toBe(true));
    const initialCount = result.current.contexts.data?.length || 0;

    // Trigger mutation
    result.current.createContext.mutate({
      name: 'New Context',
      color: '#3B82F6',
      icon: '🎉',
    });

    // Verify optimistic update (context appears immediately)
    await waitFor(() => {
      expect(result.current.contexts.data?.length).toBe(initialCount + 1);
    });

    // Wait for mutation to settle
    await waitFor(() =>
      expect(result.current.createContext.isSuccess).toBe(true)
    );

    // Verify context has real ID from server
    const newContext = result.current.contexts.data?.find(
      (c) => c.name === 'New Context'
    );
    expect(newContext?.id).not.toContain('temp-');
    expect(toast.success).toHaveBeenCalledWith(CONTEXT_MESSAGES.createSuccess);
  });

  it('rolls back on error', async () => {
    // Override handler to return 400 error
    server.use(
      http.post('*/api/v1/contexts', () => {
        return HttpResponse.json(
          { detail: CONTEXT_MESSAGES.createError },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(
      () => ({
        contexts: useContexts(),
        createContext: useCreateContext(),
      }),
      { wrapper: createWrapper() }
    );

    // Wait for initial data
    await waitFor(() => expect(result.current.contexts.isSuccess).toBe(true));
    const initialCount = result.current.contexts.data?.length || 0;

    // Trigger mutation
    result.current.createContext.mutate({
      name: 'Invalid Context',
      color: '#3B82F6',
      icon: '🎉',
    });

    // Wait for mutation error
    await waitFor(() =>
      expect(result.current.createContext.isError).toBe(true)
    );

    // Verify rollback (count returns to initial)
    expect(result.current.contexts.data?.length).toBe(initialCount);
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateContext()', () => {
  it('updates context with optimistic update', async () => {
    // Use known context ID from mock data
    const contextId = '507f1f77bcf86cd799439011';

    const { result } = renderHook(
      () => ({
        contexts: useContexts(),
        updateContext: useUpdateContext(contextId),
      }),
      { wrapper: createWrapper() }
    );

    // Wait for initial data to load
    await waitFor(() => expect(result.current.contexts.isSuccess).toBe(true));

    // Trigger mutation
    result.current.updateContext.mutate({
      name: 'Updated Work',
    });

    // Verify optimistic update (name changes immediately)
    await waitFor(() => {
      const updatedContext = result.current.contexts.data?.find(
        (c) => c.id === contextId
      );
      expect(updatedContext?.name).toBe('Updated Work');
    });

    // Wait for mutation to settle
    await waitFor(() =>
      expect(result.current.updateContext.isSuccess).toBe(true)
    );

    // Verify context remains updated
    const finalContext = result.current.contexts.data?.find(
      (c) => c.id === contextId
    );
    expect(finalContext?.name).toBe('Updated Work');
    expect(toast.success).toHaveBeenCalledWith(CONTEXT_MESSAGES.updateSuccess);
  });

  it('rolls back on error', async () => {
    // Override handler to return 500 error
    server.use(
      http.put('*/api/v1/contexts/:id', () => {
        return HttpResponse.json(
          { detail: CONTEXT_MESSAGES.updateError },
          { status: 500 }
        );
      })
    );

    // Use known context ID from mock data
    const contextId = '507f1f77bcf86cd799439011';

    const { result } = renderHook(
      () => ({
        contexts: useContexts(),
        updateContext: useUpdateContext(contextId),
      }),
      { wrapper: createWrapper() }
    );

    // Wait for initial data
    await waitFor(() => expect(result.current.contexts.isSuccess).toBe(true));

    const originalName = result.current.contexts.data?.[0]?.name || '';

    // Trigger mutation
    result.current.updateContext.mutate({
      name: 'Should Fail',
    });

    // Wait for mutation error
    await waitFor(() =>
      expect(result.current.updateContext.isError).toBe(true)
    );

    // Verify rollback (name reverts to original)
    const revertedContext = result.current.contexts.data?.find(
      (c) => c.id === contextId
    );
    expect(revertedContext?.name).toBe(originalName);
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useDeleteContext(id)', () => {
  it('removes context with optimistic update', async () => {
    // Use known context ID from mock data
    const contextId = '507f1f77bcf86cd799439011';

    const { result } = renderHook(
      () => ({
        contexts: useContexts(),
        deleteContext: useDeleteContext(contextId),
      }),
      { wrapper: createWrapper() }
    );

    // Wait for initial data
    await waitFor(() => expect(result.current.contexts.isSuccess).toBe(true));

    const initialCount = result.current.contexts.data?.length || 0;

    // Trigger mutation
    result.current.deleteContext.mutate();

    // Verify optimistic update (context disappears immediately)
    await waitFor(() => {
      expect(result.current.contexts.data?.length).toBe(initialCount - 1);
    });

    // Wait for mutation to settle
    await waitFor(() =>
      expect(result.current.deleteContext.isSuccess).toBe(true)
    );

    // Verify context remains deleted
    expect(result.current.contexts.data?.length).toBe(initialCount - 1);
    expect(toast.success).toHaveBeenCalledWith(CONTEXT_MESSAGES.deleteSuccess);
  });

  it('rolls back on error', async () => {
    // Override handler to return 403 error
    server.use(
      http.delete('*/api/v1/contexts/:id', () => {
        return HttpResponse.json(
          { detail: CONTEXT_MESSAGES.deleteError },
          { status: 403 }
        );
      })
    );

    // Use known context ID from mock data
    const contextId = '507f1f77bcf86cd799439011';

    const { result } = renderHook(
      () => ({
        contexts: useContexts(),
        deleteContext: useDeleteContext(contextId),
      }),
      { wrapper: createWrapper() }
    );

    // Wait for initial data
    await waitFor(() => expect(result.current.contexts.isSuccess).toBe(true));

    const initialCount = result.current.contexts.data?.length || 0;

    // Trigger mutation
    result.current.deleteContext.mutate();

    // Wait for mutation error
    await waitFor(() =>
      expect(result.current.deleteContext.isError).toBe(true)
    );

    // Verify rollback (context is restored)
    expect(result.current.contexts.data?.length).toBe(initialCount);
    expect(toast.error).toHaveBeenCalled();
  });
});
