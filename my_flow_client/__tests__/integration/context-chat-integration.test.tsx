/**
 * Integration tests for Context-Chat interaction.
 * Tests context switching, conversation history loading, and persistence.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from '@/components/chat/chat-interface';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Helper function to render ChatInterface with QueryClient provider.
 */
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // Disable garbage collection for predictable testing
      },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe('Context-Chat Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('Context Switching', () => {
    it('clears chat when switching contexts', async () => {
      // Mock fetch to return work context conversation
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'conv-work',
            context_id: 'ctx-work',
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'Work message',
                timestamp: new Date().toISOString(),
              },
              {
                id: 'msg-2',
                role: 'assistant',
                content: 'Work response',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ],
      }) as unknown as typeof global.fetch;

      const { rerender } = renderWithQueryClient(
        <ChatInterface contextId="ctx-work" onFlowsExtracted={vi.fn()} />
      );

      // Verify work context messages loaded
      await waitFor(() => {
        expect(screen.getByText('Work message')).toBeInTheDocument();
        expect(screen.getByText('Work response')).toBeInTheDocument();
      });

      // Mock fetch for personal context (empty)
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      }) as unknown as typeof global.fetch;

      // Switch context by rerendering with new contextId
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ChatInterface contextId="ctx-personal" onFlowsExtracted={vi.fn()} />
        </QueryClientProvider>
      );

      // Verify chat cleared and new context shows empty state
      await waitFor(() => {
        expect(screen.queryByText('Work message')).not.toBeInTheDocument();
        expect(screen.queryByText('Work response')).not.toBeInTheDocument();
        expect(
          screen.getByText(/Start a conversation/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Conversation History Loading', () => {
    it('loads conversation history for context', async () => {
      // Mock fetch to return conversation history
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'conv-1',
            context_id: 'ctx-work',
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'Hello',
                timestamp: new Date().toISOString(),
              },
              {
                id: 'msg-2',
                role: 'assistant',
                content: 'Hi there!',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ],
      }) as unknown as typeof global.fetch;

      renderWithQueryClient(
        <ChatInterface contextId="ctx-work" onFlowsExtracted={vi.fn()} />
      );

      // Verify history messages displayed
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
      });
    });

    it('shows empty state when no conversation history exists', async () => {
      // Mock fetch to return empty conversation list
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      }) as unknown as typeof global.fetch;

      renderWithQueryClient(
        <ChatInterface contextId="ctx-new" onFlowsExtracted={vi.fn()} />
      );

      // Verify empty state displayed
      await waitFor(() => {
        expect(
          screen.getByText(/Start a conversation/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton while fetching history', async () => {
      // Mock slow fetch
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => [],
                }),
              100
            )
          )
      ) as unknown as typeof global.fetch;

      renderWithQueryClient(
        <ChatInterface contextId="ctx-work" onFlowsExtracted={vi.fn()} />
      );

      // Verify loading skeleton visible
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading conversation history/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Persistence', () => {
    it('loads conversation history after simulated refresh', async () => {
      // Mock fetch to return conversation history
      const mockConversation = [
        {
          id: 'conv-persist',
          context_id: 'ctx-work',
          messages: [
            {
              id: 'msg-persist-1',
              role: 'user',
              content: 'Previous conversation',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'msg-persist-2',
              role: 'assistant',
              content: 'Still here!',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConversation,
      }) as unknown as typeof global.fetch;

      // First render
      const { unmount } = renderWithQueryClient(
        <ChatInterface contextId="ctx-work" onFlowsExtracted={vi.fn()} />
      );

      // Verify messages loaded
      await waitFor(() => {
        expect(screen.getByText('Previous conversation')).toBeInTheDocument();
      });

      // Simulate page refresh by unmounting and remounting
      unmount();

      renderWithQueryClient(
        <ChatInterface contextId="ctx-work" onFlowsExtracted={vi.fn()} />
      );

      // Verify history loaded again after "refresh"
      await waitFor(() => {
        expect(screen.getByText('Previous conversation')).toBeInTheDocument();
        expect(screen.getByText('Still here!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValueOnce(
        new Error('Network error')
      ) as unknown as typeof global.fetch;

      renderWithQueryClient(
        <ChatInterface contextId="ctx-error" onFlowsExtracted={vi.fn()} />
      );

      // Component should still render (showing empty state or error state)
      // The hook handles errors gracefully and returns empty messages
      await waitFor(() => {
        expect(
          screen.getByText(/Start a conversation/i)
        ).toBeInTheDocument();
      });
    });

    it('handles invalid context_id parameter', async () => {
      // Mock fetch to return 400 error
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'context_id required' }),
      }) as unknown as typeof global.fetch;

      renderWithQueryClient(
        <ChatInterface contextId="" onFlowsExtracted={vi.fn()} />
      );

      // Component should handle error and show empty state
      await waitFor(() => {
        expect(
          screen.getByText(/Start a conversation/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Message Limit', () => {
    it('handles 50-message limit correctly', async () => {
      // Create 60 messages (should slice to last 50)
      const messages = Array.from({ length: 60 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      }));

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'conv-large',
            context_id: 'ctx-work',
            messages,
          },
        ],
      }) as unknown as typeof global.fetch;

      renderWithQueryClient(
        <ChatInterface contextId="ctx-work" onFlowsExtracted={vi.fn()} />
      );

      // Verify last 50 messages are shown (messages 10-59)
      await waitFor(() => {
        expect(screen.queryByText('Message 0')).not.toBeInTheDocument();
        expect(screen.queryByText('Message 9')).not.toBeInTheDocument();
        expect(screen.getByText('Message 10')).toBeInTheDocument(); // First visible
        expect(screen.getByText('Message 59')).toBeInTheDocument(); // Last message
      });
    });
  });
});

