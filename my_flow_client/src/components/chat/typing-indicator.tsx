'use client';

import { type ReactElement } from 'react';
import { cn } from '@/lib/utils';
import type { TypingIndicatorProps } from '@/types/chat';

/**
 * TypingIndicator component displays animated dots
 * to indicate the assistant is typing a response.
 */
export function TypingIndicator({
  className,
}: TypingIndicatorProps): ReactElement {
  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="status"
      aria-label="Assistant is typing"
    >
      <span
        className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"
        style={{ animationDelay: '0ms', animationDuration: '1400ms' }}
      />
      <span
        className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"
        style={{ animationDelay: '200ms', animationDuration: '1400ms' }}
      />
      <span
        className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"
        style={{ animationDelay: '400ms', animationDuration: '1400ms' }}
      />
    </div>
  );
}
