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

  /**
   * Callback invoked when AI extracts flows from conversation.
   * Implementations should expect up to 50 flows; the backend caps
   * conversation history and resulting creations to prevent abuse.
   */
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

/**
 * Flow extraction event data from SSE stream.
 * Emitted when AI extracts flows from conversation.
 */
export interface FlowExtractionEvent {
  /** Extracted flows from conversation */
  flows: Flow[];

  /** Timestamp when flows were extracted */
  timestamp: string;

  /** Conversation ID where extraction occurred */
  conversationId: string;
}

/**
 * Props for the FlowExtractionNotification component.
 * Inline notification banner for flow extraction feedback.
 */
export interface FlowExtractionNotificationProps {
  /** Flows extracted from conversation */
  flows: Flow[];

  /** Callback invoked when user accepts flows */
  onAccept: () => void;

  /** Callback invoked when user dismisses flows */
  onDismiss: () => void;

  /** Context ID for the current conversation */
  contextId: string;

  /** Optional className for styling */
  className?: string;
}
