/**
 * Mock SSE (Server-Sent Events) server for testing.
 * Mocks the fetch API to return a ReadableStream that simulates SSE responses.
 */

/**
 * SSE message format
 */
export interface SSEMessage {
  type: string;
  payload: unknown;
}

/**
 * Creates a ReadableStream that simulates SSE responses
 */
function createSSEStream(messages: SSEMessage[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index < messages.length) {
        const message = messages[index];
        const data = `data: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(encoder.encode(data));
        index++;
      } else {
        // Send [DONE] and close
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
}

/**
 * Mock fetch implementation for SSE testing
 */
export class MockSSEServer {
  private messages: SSEMessage[] = [];
  private originalFetch: typeof global.fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  /**
   * Installs the mock fetch globally
   */
  install(): void {
    global.fetch = this.mockFetch.bind(this) as typeof global.fetch;
  }

  /**
   * Restores the original fetch
   */
  restore(): void {
    global.fetch = this.originalFetch;
  }

  /**
   * Queue a message to be sent when the stream is read
   */
  queueMessage(message: SSEMessage): void {
    this.messages.push(message);
  }

  /**
   * Queue multiple messages
   */
  queueMessages(messages: SSEMessage[]): void {
    this.messages.push(...messages);
  }

  /**
   * Simulate streaming tokens for an assistant message
   * @param tokens - Array of tokens to stream
   * @param messageId - ID of the message
   * @param _delay - Delay parameter (unused in mock, for API compatibility)
   */
  simulateStreamingMessage(
    tokens: string[],
    messageId: string,
    _delay: number = 0
  ): void {
    tokens.forEach((token, index) => {
      this.queueMessage({
        type: 'assistant_token',
        payload: {
          token,
          messageId,
          isComplete: index === tokens.length - 1,
        },
      });
    });
  }

  /**
   * Simulate a flows_extracted event
   */
  simulateFlowsExtractedEvent(flows: unknown[]): void {
    this.queueMessage({
      type: 'flows_extracted',
      payload: { flows },
    });
  }

  /**
   * Simulate an error message
   */
  simulateError(errorMessage: string, code?: string): void {
    this.queueMessage({
      type: 'error',
      payload: { message: errorMessage, code },
    });
  }

  /**
   * Clear all queued messages
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Mock fetch implementation
   */
  private async mockFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    // Only mock /api/chat/stream endpoint
    if (url.includes('/api/chat/stream')) {
      // Create a stream with the queued messages
      const stream = createSSEStream([...this.messages]);

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // For other endpoints, use original fetch
    return this.originalFetch(input, init);
  }
}

/**
 * Factory function to create a new MockSSEServer instance
 */
export function createMockSSEServer(): MockSSEServer {
  return new MockSSEServer();
}
