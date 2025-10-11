import type { Flow } from './flow';

/**
 * Chat message data model.
 * Represents a single message in the conversation history.
 */
export interface Message {
  /** Unique message identifier */
  id: string;

  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system';

  /** Message content (supports markdown) */
  content: string;

  /** Message timestamp in ISO 8601 format */
  timestamp: string;
}

/**
 * Props for the ChatInterface component.
 * Main chat container that manages conversation state.
 */
export interface ChatInterfaceProps {
  /** Context ID for the current conversation */
  contextId: string;

  /** Callback invoked when AI extracts flows from conversation */
  onFlowsExtracted: (flows: Flow[]) => void;

  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the MessageBubble component.
 * Displays individual messages with role-specific styling.
 */
export interface MessageBubbleProps {
  /** Message data to display */
  message: Message;

  /** Whether to show typing indicator (for assistant messages) */
  isTyping?: boolean;

  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the TypingIndicator component.
 * Shows animated dots while assistant is typing.
 */
export interface TypingIndicatorProps {
  /** Optional className for styling */
  className?: string;
}
