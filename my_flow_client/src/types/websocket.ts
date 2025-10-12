import type { Message } from './chat';
import type { Flow } from './flow';

/**
 * WebSocket message types for client-server communication
 */
export interface WebSocketMessage {
  type:
    | 'user_message'
    | 'assistant_token'
    | 'flows_extracted'
    | 'error'
    | 'connection_status';
  payload: unknown;
  timestamp?: string;
}

/**
 * Options for useChatStream hook
 */
export interface ChatStreamOptions {
  contextId: string;
  conversationId?: string;
  onFlowsExtracted?: (flows: Flow[]) => void;
  onError?: (error: Error) => void;
}

/**
 * State returned by useChatStream hook
 */
export interface ChatStreamState {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

/**
 * Configuration options for WebSocketManager
 */
export interface WebSocketManagerOptions {
  url: string;
  token: string;
  maxRetries?: number;
  retryDelays?: number[];
}
