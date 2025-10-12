'use client';

import {
  useState,
  useRef,
  useEffect,
  type ReactElement,
  type FormEvent,
} from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './message-bubble';
import { FlowExtractionNotification } from './flow-extraction-notification';
import type { ChatInterfaceProps } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useChatStream } from '@/hooks/use-chat-stream';

const CHAT_EMPTY_STATE_MIN_HEIGHT = 'var(--chat-empty-state-min-height, 25rem)';
const CHAT_TEXTAREA_MIN_HEIGHT = 'var(--chat-textarea-min-height, 3.75rem)';
const CHAT_TEXTAREA_MAX_HEIGHT = 'var(--chat-textarea-max-height, 12.5rem)';

/**
 * ChatInterface component manages the chat conversation UI.
 * Handles message display, input, auto-scroll, and user interactions.
 */
export function ChatInterface({
  contextId,
  onFlowsExtracted,
  className,
}: ChatInterfaceProps): ReactElement {
  // Use chat stream hook for SSE-based messaging
  const {
    messages,
    sendMessage,
    isStreaming,
    error,
    pendingFlows,
    showNotification,
    acceptFlows,
    dismissFlows,
  } = useChatStream(contextId, undefined, {
    onFlowsExtracted,
  });

  // Local state for input
  const [inputValue, setInputValue] = useState('');

  // Ref for auto-scroll functionality
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

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

  // Empty state
  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-bg-primary border border-border rounded-lg',
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
              {messages.map((message) => (
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
            </>
          )}
        </div>
      </ScrollArea>

      {/* Flow Extraction Notification */}
      {showNotification && (
        <div className="p-4 border-t border-border bg-bg-primary">
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
        className="p-4 border-t border-border bg-bg-secondary"
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
