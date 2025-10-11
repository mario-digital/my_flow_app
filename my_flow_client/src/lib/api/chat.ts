import type { Message } from '@/types/chat';

export interface ChatStreamEvent {
  type: 'token' | 'metadata' | 'done' | 'error';
  data?: string;
  metadata?: {
    extracted_flows: string[];
  };
  error?: string;
}

/**
 * Stream chat messages from the AI assistant.
 *
 * This function connects to the backend streaming endpoint and yields
 * events as they arrive via Server-Sent Events (SSE).
 *
 * @param contextId - Context ID for the conversation
 * @param messages - Array of messages including the new user message
 * @returns Async generator yielding chat events
 *
 * @example
 * ```typescript
 * for await (const event of streamChat(contextId, messages)) {
 *   if (event.type === 'token') {
 *     // Append token to assistant message
 *   } else if (event.type === 'metadata') {
 *     // Handle extracted flows
 *   }
 * }
 * ```
 */
export async function* streamChat(
  contextId: string,
  messages: Message[]
): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contextId,
      messages,
    }),
  });

  if (!response.ok) {
    yield {
      type: 'error',
      error: `API request failed: ${response.status} ${response.statusText}`,
    };
    return;
  }

  if (!response.body) {
    yield {
      type: 'error',
      error: 'No response body',
    };
    return;
  }

  // Read the stream using ReadableStream API
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Split buffer by double newline (SSE message delimiter)
      const lines = buffer.split('\n\n');

      // Keep the last incomplete chunk in buffer
      buffer = lines.pop() || '';

      // Process complete SSE messages
      for (const line of lines) {
        if (!line.trim()) continue;

        // Parse SSE format: "event: type\ndata: payload"
        const eventMatch = line.match(/^event:\s*(\w+)\ndata:\s*(.*)$/m);

        if (eventMatch && eventMatch[1] && eventMatch[2]) {
          const eventType = eventMatch[1];
          const eventData = eventMatch[2];

          if (eventType === 'metadata') {
            try {
              const metadata = JSON.parse(eventData) as {
                extracted_flows: string[];
              };
              yield {
                type: 'metadata',
                metadata,
              };
            } catch {
              // Ignore malformed metadata
            }
          } else if (eventType === 'done') {
            yield { type: 'done' };
          } else if (eventType === 'error') {
            try {
              const errorData = JSON.parse(eventData) as { error?: string };
              yield {
                type: 'error',
                error: errorData.error || 'Unknown error',
              };
            } catch {
              yield { type: 'error', error: eventData };
            }
          }
        } else if (line.startsWith('data: ')) {
          // Regular data event (token)
          const token = line.slice(6); // Remove "data: " prefix
          yield {
            type: 'token',
            data: token,
          };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
