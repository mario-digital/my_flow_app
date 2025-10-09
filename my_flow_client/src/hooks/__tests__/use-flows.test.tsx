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
import type { ReactNode } from 'react';

import {
  useFlows,
  useFlow,
  useCreateFlow,
  useUpdateFlow,
  useDeleteFlow,
  useCompleteFlow,
} from '../use-flows';
import { server } from '@/mocks/server';
import { resetMockFlows } from '@/mocks/handlers';
import { CurrentUserProvider } from '@/hooks/use-current-user';

// Mock toast to avoid UI side effects in tests
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock console.error to suppress expected error logs in tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Test wrapper with QueryClient and CurrentUserProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 5 * 60 * 1000, // mirror list gcTime
      },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider
        value={{
          userId: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          isAuthenticated: true,
          isLoading: false,
        }}
      >
        {children}
      </CurrentUserProvider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('use-flows hooks', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    resetMockFlows();
    consoleErrorSpy.mockClear();
  });
  afterAll(() => {
    server.close();
    consoleErrorSpy.mockRestore();
  });

  describe('useFlows', () => {
    it('successfully fetches flows for a context', async () => {
      const { result } = renderHook(
        () => useFlows('507f1f77bcf86cd799439011'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const flows = result.current.data;
      if (!flows) throw new Error('Expected flows to be defined');
      expect(flows).toHaveLength(2);
      if (flows[0]) {
        expect(flows[0].title).toBe('Complete project documentation');
      }
    });

    it('throws when unauthenticated', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const UnauthWrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <CurrentUserProvider
            value={{
              userId: null,
              email: null,
              name: null,
              isAuthenticated: false,
              isLoading: false,
            }}
          >
            {children}
          </CurrentUserProvider>
        </QueryClientProvider>
      );

      expect(() =>
        renderHook(() => useFlows('507f1f77bcf86cd799439011'), {
          wrapper: UnauthWrapper,
        })
      ).toThrow('useFlows requires an authenticated user');
    });

    it('handles fetch error', async () => {
      server.use(
        http.get('*/api/v1/contexts/:contextId/flows', () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      const { result } = renderHook(
        () => useFlows('507f1f77bcf86cd799439011'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useFlow', () => {
    it('fetches single flow by ID', async () => {
      const { result } = renderHook(() => useFlow('flow-001'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.id).toBe('flow-001');
      expect(result.current.data?.title).toBe('Complete project documentation');
    });

    it('handles 404 not found', async () => {
      const { result } = renderHook(() => useFlow('nonexistent-id'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });

  describe('useCreateFlow', () => {
    it('creates flow with optimistic update', async () => {
      const { result } = renderHook(
        () => ({
          createFlow: useCreateFlow('507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      // Wait for initial flows to load
      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const initialCount = result.current.flows.data?.length ?? 0;

      // Create new flow
      result.current.createFlow.mutate({
        context_id: '507f1f77bcf86cd799439011',
        title: 'New test flow',
        description: 'Test description',
        priority: 'medium',
        reminder_enabled: true,
      });

      // Verify optimistic update (immediate UI feedback)
      await waitFor(() => {
        const currentCount = result.current.flows.data?.length ?? 0;
        expect(currentCount).toBe(initialCount + 1);
      });

      // Verify mutation success
      await waitFor(() =>
        expect(result.current.createFlow.isSuccess).toBe(true)
      );
    });

    it('rolls back on error', async () => {
      server.use(
        http.post('*/api/v1/flows', () => {
          return HttpResponse.json(
            { detail: 'Validation error' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(
        () => ({
          createFlow: useCreateFlow('507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const initialData = result.current.flows.data;

      result.current.createFlow.mutate({
        context_id: '507f1f77bcf86cd799439011',
        title: 'Invalid flow',
        priority: 'high',
        reminder_enabled: true,
      });

      await waitFor(() => expect(result.current.createFlow.isError).toBe(true));

      // Verify rollback (data restored to previous state)
      expect(result.current.flows.data).toEqual(initialData);
    });
  });

  describe('useUpdateFlow', () => {
    it('updates flow with optimistic update', async () => {
      const { result } = renderHook(
        () => ({
          updateFlow: useUpdateFlow('flow-001', '507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));

      result.current.updateFlow.mutate({
        title: 'Updated title',
        priority: 'low',
      });

      // Verify optimistic update
      await waitFor(() => {
        const flow = result.current.flows.data?.find(
          (f) => f.id === 'flow-001'
        );
        expect(flow?.title).toBe('Updated title');
      });

      await waitFor(() =>
        expect(result.current.updateFlow.isSuccess).toBe(true)
      );
    });

    it('rolls back on error', async () => {
      server.use(
        http.put('*/api/v1/flows/:id', () => {
          return HttpResponse.json(
            { detail: 'Update failed' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () => ({
          updateFlow: useUpdateFlow('flow-001', '507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const originalFlow = result.current.flows.data?.find(
        (f) => f.id === 'flow-001'
      );

      result.current.updateFlow.mutate({ title: 'Will fail' });

      await waitFor(() => expect(result.current.updateFlow.isError).toBe(true));

      // Verify rollback
      const restoredFlow = result.current.flows.data?.find(
        (f) => f.id === 'flow-001'
      );
      expect(restoredFlow?.title).toBe(originalFlow?.title);
    });
  });

  describe('useDeleteFlow', () => {
    it('removes flow with optimistic update', async () => {
      const { result } = renderHook(
        () => ({
          deleteFlow: useDeleteFlow('flow-001', '507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const initialCount = result.current.flows.data?.length ?? 0;

      result.current.deleteFlow.mutate();

      // Verify optimistic removal
      await waitFor(() => {
        const currentCount = result.current.flows.data?.length ?? 0;
        expect(currentCount).toBe(initialCount - 1);
      });

      await waitFor(() =>
        expect(result.current.deleteFlow.isSuccess).toBe(true)
      );
    });

    it('rolls back on error', async () => {
      server.use(
        http.delete('*/api/v1/flows/:id', () => {
          return HttpResponse.json(
            { detail: 'Delete failed' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () => ({
          deleteFlow: useDeleteFlow('flow-001', '507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const initialData = result.current.flows.data;

      result.current.deleteFlow.mutate();

      await waitFor(() => expect(result.current.deleteFlow.isError).toBe(true));

      // Verify rollback
      expect(result.current.flows.data).toEqual(initialData);
    });
  });

  describe('useCompleteFlow', () => {
    it('toggles completion with optimistic update', async () => {
      const { result } = renderHook(
        () => ({
          completeFlow: useCompleteFlow('flow-001', '507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const initialCompletionStatus = result.current.flows.data?.find(
        (f) => f.id === 'flow-001'
      )?.is_completed;

      result.current.completeFlow.mutate();

      // Verify optimistic toggle
      await waitFor(() => {
        const flow = result.current.flows.data?.find(
          (f) => f.id === 'flow-001'
        );
        expect(flow?.is_completed).toBe(!initialCompletionStatus);
      });

      await waitFor(() =>
        expect(result.current.completeFlow.isSuccess).toBe(true)
      );
    });

    it('rolls back on error', async () => {
      server.use(
        http.patch('*/api/v1/flows/:id/complete', () => {
          return HttpResponse.json(
            { detail: 'Complete failed' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () => ({
          completeFlow: useCompleteFlow('flow-001', '507f1f77bcf86cd799439011'),
          flows: useFlows('507f1f77bcf86cd799439011'),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.flows.isSuccess).toBe(true));
      const originalFlow = result.current.flows.data?.find(
        (f) => f.id === 'flow-001'
      );

      result.current.completeFlow.mutate();

      await waitFor(() =>
        expect(result.current.completeFlow.isError).toBe(true)
      );

      // Verify rollback
      const restoredFlow = result.current.flows.data?.find(
        (f) => f.id === 'flow-001'
      );
      expect(restoredFlow?.is_completed).toBe(originalFlow?.is_completed);
    });
  });
});
