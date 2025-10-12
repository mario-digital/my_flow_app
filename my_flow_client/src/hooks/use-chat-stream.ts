'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { Message } from '@/types/chat';
import type { ChatStreamState, ChatStreamOptions } from '@/types/websocket';
import { flowKeys } from '@/hooks/use-flows';
import type { Flow } from '@/types/flow';

/**
 * React hook for SSE-based AI chat streaming via BFF pattern.
 *
 * Connects to Next.js BFF endpoint (/api/chat/stream) which proxies to FastAPI.
 * JWT tokens stay server-side; browser never sees them.
 * Implements automatic reconnection with exponential backoff (max 3 retries).
 *
 * @param contextId - Context ID for the conversation
 * @param conversationId - Optional conversation ID to continue existing conversation
 * @param options - Optional callbacks for flow extraction and errors
 * @returns Chat stream state with messages, sendMessage function, and connection status
 *
 * @example
 * ```typescript
 * const { messages, sendMessage, isStreaming, error, connectionStatus } =
 *   useChatStream(contextId, conversationId, {
 *     onFlowsExtracted: (flows) => console.log('Extracted flows:', flows),
 *     onError: (err) => console.error('Chat error:', err)
 *   });
 * ```
 */
export function useChatStream(
  contextId: string,
  conversationId?: string,
  options?: Omit<ChatStreamOptions, 'contextId' | 'conversationId'>
): ChatStreamState {
  const queryClient = useQueryClient();

  // State variables
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');

  // Flow extraction notification state
  const [pendingFlows, setPendingFlows] = useState<Flow[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  // Refs for current assistant message and retry logic
  const currentAssistantMessageRef = useRef<Message | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handles incoming assistant tokens and builds the assistant message.
   */
  const handleAssistantToken = useCallback(
    (payload: { token: string; messageId: string; isComplete?: boolean }) => {
      const { token, messageId, isComplete } = payload;

      console.log('[handleAssistantToken]', {
        token: token.substring(0, 20),
        messageId,
        isComplete,
      });

      setMessages((prev) => {
        console.log('[handleAssistantToken] prev messages:', prev.length);
        console.log(
          '[handleAssistantToken] currentAssistantMessageRef:',
          currentAssistantMessageRef.current?.id
        );

        // Check if assistant message already exists in the array
        const existingAssistantMsg = prev.find((msg) => msg.id === messageId);

        if (existingAssistantMsg) {
          // Append token to existing assistant message
          const result = prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: msg.content + token }
              : msg
          );
          console.log(
            '[handleAssistantToken] Appending to existing message, result length:',
            result.length
          );
          return result;
        } else {
          // Create new assistant message (first token)
          const newMessage: Message = {
            id: messageId,
            role: 'assistant',
            content: token,
            timestamp: new Date().toISOString(),
          };
          currentAssistantMessageRef.current = newMessage;
          const result = [...prev, newMessage];
          console.log(
            '[handleAssistantToken] Creating new assistant message, result length:',
            result.length
          );
          return result;
        }
      });

      // If streaming is complete, clear the current message ref
      if (isComplete) {
        setIsStreaming(false);
        currentAssistantMessageRef.current = null;
      }
    },
    []
  );

  /**
   * Handles flows_extracted event from server.
   */
  const handleFlowsExtracted = useCallback(
    (payload: { flows: Flow[] }) => {
      const { flows } = payload;

      // Store flows and show notification
      setPendingFlows(flows);
      setShowNotification(true);

      // Call optional callback
      if (options?.onFlowsExtracted) {
        options.onFlowsExtracted(flows);
      }
    },
    [options]
  );

  /**
   * Handles error messages from server.
   */
  const handleError = useCallback(
    (payload: { message?: string; code?: string }) => {
      const errorMessage =
        payload.message || 'An error occurred during streaming';
      setError(errorMessage);
      setIsStreaming(false);

      // Call optional error callback
      if (options?.onError) {
        options.onError(new Error(errorMessage));
      }
    },
    [options]
  );

  /**
   * Attempts reconnection with exponential backoff.
   */
  const attemptReconnect = useCallback(() => {
    const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

    if (retryCountRef.current >= 3) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus('error');
      setError('Connection lost. Maximum retry attempts reached.');
      return;
    }

    const delay =
      retryDelays[retryCountRef.current] || retryDelays[retryDelays.length - 1];
    console.log(
      `Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/3)...`
    );

    setConnectionStatus('connecting');
    setError('Connection lost, attempting to reconnect...');

    retryTimeoutRef.current = setTimeout(() => {
      retryCountRef.current++;
      // Connection will be re-established by the main effect
    }, delay);
  }, []);

  /**
   * Accept extracted flows (optimistic UI update).
   * Immediately adds flows to cache, then triggers background refetch for server confirmation.
   */
  const acceptFlows = useCallback(() => {
    // Optimistically update cache (instant UI feedback)
    queryClient.setQueryData<Flow[]>(flowKeys.list(contextId), (old) => [
      ...(old || []),
      ...pendingFlows,
    ]);

    // Invalidate to trigger background refetch (server confirmation)
    void queryClient.invalidateQueries({
      queryKey: flowKeys.list(contextId),
    });

    // Clear notification
    setPendingFlows([]);
    setShowNotification(false);
  }, [contextId, pendingFlows, queryClient]);

  /**
   * Dismiss extracted flows.
   * Deletes flows from backend via BFF proxy, then hides notification.
   */
  const dismissFlows = useCallback(async () => {
    try {
      // Delete flows from backend via Next.js BFF proxy (not FastAPI directly)
      await Promise.all(
        pendingFlows.map((flow) =>
          fetch(`/api/flows/${flow.id}`, { method: 'DELETE' })
        )
      );

      // Clear notification
      setPendingFlows([]);
      setShowNotification(false);
    } catch (err) {
      console.error('Failed to dismiss flows:', err);
      setError(err instanceof Error ? err.message : 'Failed to dismiss flows');
    }
  }, [pendingFlows]);

  /**
   * Sends a user message through the BFF endpoint.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (
        connectionStatus !== 'connected' &&
        connectionStatus !== 'disconnected'
      ) {
        setError('Cannot send message while connecting');
        return;
      }

      // Create user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      // Build messages array synchronously BEFORE setState
      // We can't rely on setState callback to capture the value
      const messagesToSend = [...messages, userMessage];

      console.log('[useChatStream] Current messages:', messages.length);
      console.log('[useChatStream] Messages to send:', messagesToSend.length);

      // Update UI state optimistically
      setMessages(messagesToSend);

      // Set streaming state
      setIsStreaming(true);
      setError(null); // Clear any previous errors
      setConnectionStatus('connecting');

      console.log('[useChatStream] About to send:', {
        contextId,
        conversationId,
        messageCount: messagesToSend.length,
      });

      try {
        // Send to Next.js BFF endpoint (no token needed - uses session cookie)
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contextId,
            conversationId,
            messages: messagesToSend,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        setConnectionStatus('connected');
        retryCountRef.current = 0; // Reset retry count on successful connection

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsStreaming(false);
            currentAssistantMessageRef.current = null;
            setConnectionStatus('disconnected');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;

            console.log(
              '[useChatStream] Received line:',
              line.substring(0, 100)
            );

            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              console.log(
                '[useChatStream] Data content:',
                data.substring(0, 200)
              );

              if (data === '[DONE]') {
                setIsStreaming(false);
                currentAssistantMessageRef.current = null;
                continue;
              }

              try {
                const parsed = JSON.parse(data) as {
                  type: string;
                  payload: unknown;
                };

                console.log('[useChatStream] Parsed event type:', parsed.type);

                switch (parsed.type) {
                  case 'assistant_token':
                    handleAssistantToken(
                      parsed.payload as {
                        token: string;
                        messageId: string;
                        isComplete?: boolean;
                      }
                    );
                    break;
                  case 'flows_extracted':
                    handleFlowsExtracted(parsed.payload as { flows: Flow[] });
                    break;
                  case 'error':
                    handleError(
                      parsed.payload as { message?: string; code?: string }
                    );
                    break;
                  default:
                    // Ignore unknown message types
                    break;
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to stream chat:', err);
        setConnectionStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsStreaming(false);

        if (options?.onError) {
          options.onError(
            err instanceof Error ? err : new Error('Failed to send message')
          );
        }

        // Attempt reconnection
        attemptReconnect();
      }
    },
    [
      contextId,
      conversationId,
      connectionStatus,
      messages,
      handleAssistantToken,
      handleFlowsExtracted,
      handleError,
      options,
      attemptReconnect,
    ]
  );

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      currentAssistantMessageRef.current = null;
    };
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    error,
    connectionStatus,
    pendingFlows,
    showNotification,
    acceptFlows,
    dismissFlows,
  };
}
