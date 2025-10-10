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
import type { ChatInterfaceProps, Message } from '@/types/chat';
import { cn } from '@/lib/utils';

/**
 * ChatInterface component manages the chat conversation UI.
 * Handles message display, input, auto-scroll, and user interactions.
 */
export function ChatInterface({
  contextId: _contextId,
  conversationId: _conversationId,
  onFlowsExtracted: _onFlowsExtracted,
  className,
}: ChatInterfaceProps): ReactElement {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  // Ref for auto-scroll functionality
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [messages, isAssistantTyping]);

  // Handle sending a message
  const handleSendMessage = async (e?: FormEvent): Promise<void> => {
    e?.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || !_contextId) return;

    // Create new user message
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };

    // Add message to list
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Clear input
    setInputValue('');

    // Start streaming assistant response
    setIsAssistantTyping(true);

    // Import streaming function dynamically
    const { streamChat } = await import('@/lib/api/chat');

    // Create assistant message placeholder
    const assistantMessageId = crypto.randomUUID();
    let assistantContent = '';

    try {
      // Stream the response
      for await (const event of streamChat(_contextId, updatedMessages)) {
        if (event.type === 'token' && event.data) {
          // Append token to assistant message
          assistantContent += event.data;

          // Update assistant message in real-time
          setMessages((prev) => {
            const existing = prev.find((m) => m.id === assistantMessageId);
            if (existing) {
              // Update existing message
              return prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: assistantContent }
                  : m
              );
            } else {
              // Add new assistant message
              return [
                ...prev,
                {
                  id: assistantMessageId,
                  role: 'assistant' as const,
                  content: assistantContent,
                  timestamp: new Date().toISOString(),
                },
              ];
            }
          });
        } else if (event.type === 'metadata' && event.metadata) {
          // Flow extraction completed
          if (event.metadata.extracted_flows.length > 0) {
            console.log('Flows extracted:', event.metadata.extracted_flows);
            // Note: Could call _onFlowsExtracted callback here if needed
            // Would need to fetch the actual Flow objects from the IDs
          }
        } else if (event.type === 'error') {
          console.error('Chat stream error:', event.error);
          // Optionally show error to user
        } else if (event.type === 'done') {
          console.log('Chat stream complete');
        }
      }
    } catch (error) {
      console.error('Failed to stream chat:', error);
      // Optionally show error message to user
    } finally {
      setIsAssistantTyping(false);
    }
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
          {isEmpty ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
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
              {isAssistantTyping && (
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

      {/* Input Area */}
      <form
        onSubmit={(e): void => {
          void handleSendMessage(e);
        }}
        className="p-4 border-t border-border bg-bg-secondary"
      >
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Ctrl+Enter to send)"
            className="flex-1 min-h-[60px] max-h-[200px] resize-none bg-input border-input-border focus:border-input-border-focus"
            aria-label="Message input"
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
