'use client';

import type { JSX } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for ChatLoadingSkeleton component.
 */
export interface ChatLoadingSkeletonProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * ChatLoadingSkeleton displays animated loading placeholders
 * while conversation history is being fetched.
 *
 * Uses semantic skeleton design tokens from effects.css:
 * - h-skeleton-text (16px): Body text lines
 * - h-skeleton-avatar (32px): Avatar circles
 * - h-skeleton-input (44px): Input field height
 * - w-skeleton-lg (75%): Large text width
 * - w-skeleton-md (60%): Medium text width
 * - w-skeleton-sm (45%): Small text width
 * - w-skeleton-xs (33%): Extra small text width
 *
 * Shows 3 message skeletons (2 assistant, 1 user) with
 * pulsing animation to indicate loading state.
 *
 * @param props - Component props
 * @returns Loading skeleton UI
 */
export function ChatLoadingSkeleton({
  className,
}: ChatLoadingSkeletonProps = {}): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-bg-primary border border-border-subtle rounded-lg overflow-hidden shadow-[0_0_0_1px_rgba(74,144,226,0.1)]',
        className
      )}
    >
      <div
        className="flex-1 space-y-4 p-4"
        role="status"
        aria-label="Loading conversation history"
      >
        {/* Assistant message skeleton */}
        <div className="flex gap-3">
          <div className="h-skeleton-avatar w-skeleton-avatar rounded-full bg-bg-tertiary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-skeleton-text bg-bg-tertiary rounded-md animate-pulse w-skeleton-lg" />
            <div className="h-skeleton-text bg-bg-tertiary rounded-md animate-pulse w-skeleton-md" />
          </div>
        </div>

        {/* User message skeleton (right-aligned) */}
        <div className="flex gap-3 justify-end">
          <div className="flex-1 space-y-2 flex flex-col items-end">
            <div className="h-skeleton-text bg-context rounded-md animate-pulse w-skeleton-md opacity-20" />
            <div className="h-skeleton-text bg-context rounded-md animate-pulse w-skeleton-xs opacity-20" />
          </div>
          <div className="h-skeleton-avatar w-skeleton-avatar rounded-full bg-context animate-pulse opacity-20" />
        </div>

        {/* Another assistant message skeleton */}
        <div className="flex gap-3">
          <div className="h-skeleton-avatar w-skeleton-avatar rounded-full bg-bg-tertiary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-skeleton-text bg-bg-tertiary rounded-md animate-pulse w-skeleton-xl" />
            <div className="h-skeleton-text bg-bg-tertiary rounded-md animate-pulse w-skeleton-lg" />
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="p-4 border-t border-border-subtle bg-bg-secondary">
        <div className="h-skeleton-input bg-bg-tertiary rounded-md animate-pulse" />
      </div>
    </div>
  );
}
