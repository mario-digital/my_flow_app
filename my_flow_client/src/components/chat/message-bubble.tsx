'use client';

import { type ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle } from 'lucide-react';
import type { MessageBubbleProps } from '@/types/chat';
import { cn } from '@/lib/utils';
import { TypingIndicator } from './typing-indicator';

/**
 * MessageBubble component displays individual chat messages.
 * Supports user, assistant, and system message roles with distinct styling.
 * Renders markdown content with GitHub Flavored Markdown support.
 */
export function MessageBubble({
  message,
  isTyping = false,
  className,
}: MessageBubbleProps): ReactElement {
  // Format timestamp for display using locale-aware formatting
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // User messages: right-aligned with context color
  if (message.role === 'user') {
    return (
      <div className={cn('flex justify-end mb-4', className)}>
        <div className="flex flex-col items-end max-w-[70%]">
          <div
            className="
              bg-[var(--message-bg-user)]
              text-[var(--message-text-user)]
              px-4 py-3
              rounded-lg rounded-br-[4px]
              text-base leading-relaxed
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          <span className="text-xs text-text-secondary mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Assistant messages: left-aligned with AI avatar
  if (message.role === 'assistant') {
    return (
      <div className={cn('flex items-start gap-3 mb-4', className)}>
        {/* AI Avatar */}
        <div
          className="
            w-8 h-8 flex-shrink-0
            bg-bg-elevated
            border border-border-default
            rounded-full
            flex items-center justify-center
          "
        >
          <MessageCircle className="w-4 h-4 text-context" />
        </div>

        {/* Message Content */}
        <div className="flex flex-col max-w-[70%]">
          <div
            className="
              bg-[var(--message-bg-ai)]
              text-[var(--message-text-ai)]
              border border-border-subtle
              px-4 py-3
              rounded-lg rounded-bl-[4px]
              text-base leading-relaxed
            "
          >
            {isTyping ? (
              <TypingIndicator />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          <span className="text-xs text-text-secondary mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // System messages: centered with muted styling (rarely used)
  return (
    <div className={cn('flex justify-center mb-4', className)}>
      <div className="text-sm text-text-muted italic">{message.content}</div>
    </div>
  );
}
