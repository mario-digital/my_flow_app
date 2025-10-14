'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { Message } from '@/types/chat';
import type { ChatStreamState, ChatStreamOptions } from '@/types/websocket';
import { flowKeys } from '@/hooks/use-flows';
import { conversationKeys } from '@/hooks/use-conversation-history';
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

  // Track context switches to inform AI on next message
  const isContextSwitchRef = useRef<boolean>(false);
  const previousContextIdRef = useRef<string>(contextId);

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
          const result = prev
            .map((msg) =>
              msg.id === messageId
                ? { ...msg, content: msg.content + token }
                : msg
            )
            .slice(-50);
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
          const result = [...prev, newMessage].slice(-50);
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

    // Invalidate context summaries to update counts
    void queryClient.invalidateQueries({
      queryKey: ['context-summaries'],
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
   * Handle tool execution from AI.
   * Shows a toast notification and invalidates flows/summaries queries to update UI.
   */
  const handleToolExecuted = useCallback(
    async (payload: {
      tool_name: string;
      result: { success: boolean; message?: string; error?: string };
    }) => {
      console.log('[useChatStream] Tool executed:', payload);

      // Show toast notification
      if (payload.result.success) {
        console.log(
          '[useChatStream] Tool execution successful, calling onToolExecuted callback'
        );
        options?.onToolExecuted?.(payload.tool_name, payload.result);

        console.log(
          '[useChatStream] Invalidating flows and context summaries queries'
        );
        // Invalidate flows query to refresh the flow list
        await queryClient.invalidateQueries({
          queryKey: flowKeys.list(contextId),
        });
        // Invalidate context summaries to update counts on dashboard
        await queryClient.invalidateQueries({
          queryKey: ['context-summaries'],
        });
        console.log('[useChatStream] All queries invalidated and refetched');
      } else {
        console.error('Tool execution failed:', payload.result.error);
        options?.onError?.(
          new Error(payload.result.error || 'Tool execution failed')
        );
      }
    },
    [contextId, queryClient, options]
  );

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
      const messagesToSend = [...messages, userMessage].slice(-50);

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
        const isContextSwitch = isContextSwitchRef.current;
        console.log(
          `[useChatStream] Sending message with isContextSwitch=${isContextSwitch}`
        );

        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contextId,
            conversationId,
            messages: messagesToSend,
            isContextSwitch,
          }),
        });

        // Reset context switch flag after sending
        if (isContextSwitch) {
          console.log(
            '[useChatStream] Resetting isContextSwitch flag after sending'
          );
          isContextSwitchRef.current = false;
        }

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
                  case 'tool_executed':
                    void handleToolExecuted(
                      parsed.payload as {
                        tool_name: string;
                        result: {
                          success: boolean;
                          message?: string;
                          error?: string;
                        };
                      }
                    );
                    break;
                  case 'conversation_updated':
                    {
                      const { conversation_id } = parsed.payload as {
                        conversation_id?: string;
                      };
                      console.log(
                        '[useChatStream] Conversation updated event received:',
                        conversation_id
                      );
                      if (conversation_id) {
                        options?.onConversationUpdated?.(conversation_id);
                      }
                      void queryClient.invalidateQueries({
                        queryKey: conversationKeys.byContext(contextId),
                      });
                    }
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
      } finally {
        // Ensure conversation cache stays in sync even if errors occur
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.byContext(contextId),
        });
      }
    },
    [
      contextId,
      conversationId,
      connectionStatus,
      messages,
      handleAssistantToken,
      handleFlowsExtracted,
      handleToolExecuted,
      handleError,
      options,
      attemptReconnect,
      queryClient,
    ]
  );

  /**
   * Detect context switches and flag the next message.
   */
  useEffect(() => {
    if (previousContextIdRef.current !== contextId) {
      console.log(
        `[useChatStream] Context switched from ${previousContextIdRef.current} to ${contextId}`
      );
      isContextSwitchRef.current = true;
      previousContextIdRef.current = contextId;

      // Clear context-specific transient UI (flows notifications) on switch
      setPendingFlows([]);
      setShowNotification(false);
    }
  }, [contextId]);

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
