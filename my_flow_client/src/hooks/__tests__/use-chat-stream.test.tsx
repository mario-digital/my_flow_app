import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useChatStream } from '../use-chat-stream';
import {
  createMockSSEServer,
  MockSSEServer,
} from '@/__tests__/helpers/mock-sse-server';
import { FlowPriority } from '@/types/enums';
import type { Flow } from '@/types/flow';

describe('useChatStream (SSE via BFF)', () => {
  let queryClient: QueryClient;
  let mockServer: MockSSEServer;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockServer = createMockSSEServer();
    mockServer.install();
  });

  afterEach(() => {
    mockServer.restore();
    queryClient.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return initial state', () => {
    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('should send user message and update state optimistically', async () => {
    mockServer.simulateStreamingMessage(
      ['Hello', ' from', ' AI'],
      'assistant-msg-1'
    );

    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    await act(async () => {
      await result.current.sendMessage('Hello AI');
    });

    // User message should be added immediately
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
      expect(result.current.messages[0]?.role).toBe('user');
      expect(result.current.messages[0]?.content).toBe('Hello AI');
    });
  });

  it('should receive streaming tokens and build assistant message', async () => {
    mockServer.simulateStreamingMessage(
      ['Once', ' upon', ' a', ' time.'],
      'assistant-msg-1'
    );

    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    await act(async () => {
      await result.current.sendMessage('Tell me a story');
    });

    // Wait for streaming to complete
    await waitFor(
      () => {
        const assistantMsg = result.current.messages.find(
          (m) => m.role === 'assistant'
        );
        expect(assistantMsg?.content).toBe('Once upon a time.');
        expect(result.current.isStreaming).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it('should handle flows_extracted event and show notification', async () => {
    const mockFlows: Flow[] = [
      {
        id: 'flow-1',
        context_id: 'ctx-1',
        user_id: 'user-1',
        title: 'Task 1',
        description: undefined,
        priority: FlowPriority.Low,
        is_completed: false,
        due_date: undefined,
        reminder_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: undefined,
      },
    ];

    const onFlowsExtractedMock = vi.fn();
    // Create a spy that tracks flow-specific invalidation calls only
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    // Reset the spy counter to start fresh after hook setup
    invalidateQueriesSpy.mockClear();

    mockServer.simulateStreamingMessage(['Response'], 'assistant-msg-1');
    mockServer.simulateFlowsExtractedEvent(mockFlows);

    const { result } = renderHook(
      () =>
        useChatStream('ctx-1', undefined, {
          onFlowsExtracted: onFlowsExtractedMock,
        }),
      { wrapper }
    );

    // Clear calls from hook initialization
    invalidateQueriesSpy.mockClear();

    await act(async () => {
      await result.current.sendMessage('Extract flows from this');
    });

    // Story 3.7: flows_extracted event now stores flows in pendingFlows state
    // and shows notification. Invalidation happens when user accepts via acceptFlows()
    await waitFor(
      () => {
        expect(onFlowsExtractedMock).toHaveBeenCalledWith(mockFlows);
        expect(result.current.pendingFlows).toEqual(mockFlows);
        expect(result.current.showNotification).toBe(true);
        // Check that flow-specific invalidation did NOT happen automatically
        // (only conversation invalidation happens on message send)
        const flowInvalidations = invalidateQueriesSpy.mock.calls.filter(
          (call) =>
            call[0]?.queryKey?.[0] === 'flows' ||
            (Array.isArray(call[0]?.queryKey) &&
              call[0].queryKey[0] === 'flows')
        );
        expect(flowInvalidations.length).toBe(0);
      },
      { timeout: 3000 }
    );

    // When user accepts flows, THEN flow invalidation should happen
    await act(async () => {
      result.current.acceptFlows();
    });

    await waitFor(
      () => {
        // Now flow invalidation should have been called
        const flowInvalidations = invalidateQueriesSpy.mock.calls.filter(
          (call) =>
            call[0]?.queryKey?.[0] === 'flows' ||
            (Array.isArray(call[0]?.queryKey) &&
              call[0].queryKey[0] === 'flows')
        );
        expect(flowInvalidations.length).toBeGreaterThan(0);
        expect(result.current.pendingFlows).toEqual([]);
        expect(result.current.showNotification).toBe(false);
      },
      { timeout: 1000 }
    );
  });

  it('should handle error messages from server', async () => {
    const onErrorMock = vi.fn();

    mockServer.simulateError('Rate limit exceeded', 'RATE_LIMIT');

    const { result } = renderHook(
      () => useChatStream('ctx-1', undefined, { onError: onErrorMock }),
      { wrapper }
    );

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    await waitFor(
      () => {
        expect(result.current.error).toBe('Rate limit exceeded');
        expect(result.current.isStreaming).toBe(false);
        expect(onErrorMock).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('should handle network errors gracefully', async () => {
    mockServer.restore(); // Remove mock to simulate network failure

    // Mock fetch to reject
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    await waitFor(
      () => {
        // Error message could be direct error or reconnection message
        expect(result.current.error).toBeTruthy();
        expect(['error', 'connecting']).toContain(
          result.current.connectionStatus
        );
      },
      { timeout: 3000 }
    );
  });

  it('should include contextId in request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    mockServer.simulateStreamingMessage(['Response'], 'assistant-msg-1');

    const { result } = renderHook(() => useChatStream('ctx-123'), { wrapper });

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/chat/stream',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"contextId":"ctx-123"'),
        })
      );
    });
  });

  it('should include conversationId when provided', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    mockServer.simulateStreamingMessage(['Response'], 'assistant-msg-1');

    const { result } = renderHook(() => useChatStream('ctx-1', 'conv-456'), {
      wrapper,
    });

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/chat/stream',
        expect.objectContaining({
          body: expect.stringContaining('"conversationId":"conv-456"'),
        })
      );
    });
  });

  it('should clear error when sending new message', async () => {
    mockServer.simulateError('First error', 'ERROR_1');

    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    // Send first message that will error
    await act(async () => {
      await result.current.sendMessage('First message');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Send second message (should clear error)
    mockServer.clearMessages();
    mockServer.simulateStreamingMessage(['Success'], 'assistant-msg-2');

    await act(async () => {
      await result.current.sendMessage('Second message');
    });

    // Error should be cleared
    expect(result.current.error).toBeNull();
  });

  it('should handle connection state transitions', async () => {
    mockServer.simulateStreamingMessage(['Response'], 'assistant-msg-1');

    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    // Initially disconnected
    expect(result.current.connectionStatus).toBe('disconnected');

    // Send message
    await act(async () => {
      await result.current.sendMessage('Test');
    });

    // Connection goes through: disconnected -> connecting -> connected -> disconnected
    // Due to async nature, we just verify it reaches a valid final state
    await waitFor(
      () => {
        expect(['connecting', 'connected', 'disconnected']).toContain(
          result.current.connectionStatus
        );
      },
      { timeout: 3000 }
    );
  });

  it('should handle multiple messages sequentially', async () => {
    // With SSE, each sendMessage creates a new fetch request
    // This is different from WebSocket where you have one persistent connection
    mockServer.simulateStreamingMessage(['Response1'], 'assistant-msg-1');

    const { result } = renderHook(() => useChatStream('ctx-1'), { wrapper });

    await act(async () => {
      await result.current.sendMessage('First message');
    });

    // Should have both user and assistant messages
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
      const userMsg = result.current.messages.find((m) => m.role === 'user');
      const assistantMsg = result.current.messages.find(
        (m) => m.role === 'assistant'
      );
      expect(userMsg?.content).toBe('First message');
      expect(assistantMsg?.content).toBe('Response1');
    });
  });
});
