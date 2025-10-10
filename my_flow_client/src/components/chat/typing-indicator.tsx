'use client';

import { type ReactElement } from 'react';
import { cn } from '@/lib/utils';
import type { TypingIndicatorProps } from '@/types/chat';

/**
 * TypingIndicator component displays animated dots
 * to indicate the assistant is typing a response.
 *
 * Uses custom animation classes defined in globals.css for
 * staggered pulse animation with proper timing delays.
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
      <span className="w-2 h-2 bg-text-secondary rounded-full typing-dot-1" />
      <span className="w-2 h-2 bg-text-secondary rounded-full typing-dot-2" />
      <span className="w-2 h-2 bg-text-secondary rounded-full typing-dot-3" />
    </div>
  );
}
