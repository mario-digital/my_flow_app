'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type ReactElement,
  type FormEvent,
} from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './message-bubble';
import { FlowExtractionNotification } from './flow-extraction-notification';
import { ChatLoadingSkeleton } from './chat-loading-skeleton';
import type { ChatInterfaceProps, Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useConversationHistory } from '@/hooks/use-conversation-history';

const CHAT_EMPTY_STATE_MIN_HEIGHT = 'var(--chat-empty-state-min-height, 25rem)';
const CHAT_TEXTAREA_MIN_HEIGHT = 'var(--chat-textarea-min-height, 3.75rem)';
const CHAT_TEXTAREA_MAX_HEIGHT = 'var(--chat-textarea-max-height, 12.5rem)';

/**
 * ChatInterface component manages the chat conversation UI.
 * Handles message display, input, auto-scroll, and user interactions.
 *
 * Chat messages are automatically saved to backend after each send/receive.
 * Conversation history is loaded on mount and persists across page refreshes.
 * Backend enforces a 50-message limit per conversation for performance.
 */
export function ChatInterface({
  contextId,
  onFlowsExtracted,
  className,
}: ChatInterfaceProps): ReactElement {
  // Load conversation history for current context
  const {
    messages: historyMessages,
    conversationId,
    isLoading: isLoadingHistory,
  } = useConversationHistory(contextId);

  // State for current streaming session messages (not yet saved)
  const [streamingMessages, setStreamingMessages] = useState<Message[]>([]);

  // Track previous contextId to detect changes
  const prevContextIdRef = useRef<string>(contextId);

  // Use chat stream hook for SSE-based messaging
  const {
    messages: liveMessages,
    sendMessage,
    isStreaming,
    error,
    pendingFlows,
    showNotification,
    acceptFlows,
    dismissFlows,
  } = useChatStream(contextId, conversationId ?? undefined, {
    onFlowsExtracted,
    onToolExecuted: (toolName, result) => {
      // Show toast notification when AI executes a tool
      if (result.success) {
        toast.success(result.message || `Action completed: ${toolName}`);
      } else {
        toast.error(result.error || `Failed to execute: ${toolName}`);
      }
    },
  });

  // Update streaming messages when live messages change
  useEffect(() => {
    setStreamingMessages(liveMessages);
  }, [liveMessages]);

  // Clear streaming messages when context changes
  useEffect(() => {
    if (prevContextIdRef.current !== contextId) {
      prevContextIdRef.current = contextId;
    }
  }, [contextId]);

  // Merge history with current streaming messages
  const allMessages = useMemo(() => {
    return streamingMessages.length > 0 ? streamingMessages : historyMessages;
  }, [historyMessages, streamingMessages]);

  // Local state for input
  const [inputValue, setInputValue] = useState('');

  // Ref for auto-scroll functionality
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current?.scrollIntoView) {
      endOfMessagesRef.current.scrollIntoView({
        behavior: isStreaming ? 'auto' : 'smooth',
        block: 'end',
      });
    }
  }, [allMessages, isStreaming]);

  // Handle sending a message
  const handleSendMessage = async (e?: FormEvent): Promise<void> => {
    e?.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    // Clear input immediately for better UX
    setInputValue('');

    // Send message via hook
    await sendMessage(trimmedInput);
  };

  // Handle form submit (non-async wrapper for form onSubmit)
  const handleFormSubmit = (e: FormEvent): void => {
    e.preventDefault();
    void handleSendMessage(e);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  // Show loading skeleton while fetching history
  if (isLoadingHistory) {
    return <ChatLoadingSkeleton className={className} />;
  }

  // Empty state
  const isEmpty = allMessages.length === 0;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-bg-primary border border-border-subtle rounded-lg overflow-hidden shadow-[0_0_0_1px_rgba(74,144,226,0.1)]',
        className
      )}
    >
      {/* Message History */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div ref={scrollViewportRef} className="space-y-2">
          {/* Error Display */}
          {error && (
            <div
              className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4"
              role="alert"
            >
              <p className="font-medium">Connection Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {isEmpty ? (
            // Empty state
            <div
              className="flex flex-col items-center justify-center h-full text-center"
              style={{ minHeight: CHAT_EMPTY_STATE_MIN_HEIGHT }}
            >
              <MessageSquare className="w-16 h-16 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                Ask me anything about your tasks, and I&apos;ll help you
                organize them into actionable flows.
              </p>
            </div>
          ) : (
            // Message list
            <>
              {allMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isTyping={false}
                />
              ))}
              {/* Typing indicator */}
              {isStreaming && (
                <MessageBubble
                  message={{
                    id: 'typing',
                    role: 'assistant',
                    content: '',
                    timestamp: new Date().toISOString(),
                  }}
                  isTyping={true}
                />
              )}
              <div ref={endOfMessagesRef} aria-hidden="true" />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Flow Extraction Notification */}
      {showNotification && (
        <div className="p-4 border-t border-border-subtle bg-bg-primary">
          <FlowExtractionNotification
            flows={pendingFlows}
            onAccept={acceptFlows}
            onDismiss={() => void dismissFlows()}
            contextId={contextId}
          />
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleFormSubmit}
        className="p-4 border-t border-border-subtle bg-bg-secondary"
      >
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Ctrl+Enter to send)"
            className="flex-1 resize-none bg-input border-input-border focus:border-input-border-focus"
            aria-label="Message input"
            style={{
              minHeight: CHAT_TEXTAREA_MIN_HEIGHT,
              maxHeight: CHAT_TEXTAREA_MAX_HEIGHT,
            }}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim()}
            className="self-end"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Press Ctrl+Enter to send your message
        </p>
      </form>
    </div>
  );
}
