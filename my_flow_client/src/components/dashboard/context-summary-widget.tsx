'use client';

import type { ReactElement } from 'react';
import { AlertCircle } from 'lucide-react';
import { useContextSummaries } from '@/hooks/use-context-summaries';
import { ContextSummaryCard } from './context-summary-card';
import { cn } from '@/lib/utils';

export interface ContextSummaryWidgetProps {
  /** Callback when a context card is clicked */
  onContextClick: (contextId: string) => void;
  className?: string;
}

export function ContextSummaryWidget({
  onContextClick,
  className,
}: ContextSummaryWidgetProps): ReactElement {
  const { data: contextSummaries, isLoading, error } = useContextSummaries();

  // Loading state - component-styling-guide.md#1568-1686
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse space-y-4 rounded-card border border-card-border bg-card p-4"
          >
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
              <div className="h-skeleton-title w-skeleton-lg rounded-md bg-bg-tertiary" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-3">
              <div className="h-skeleton-text w-skeleton-full rounded-md bg-bg-tertiary" />
              <div className="h-skeleton-text w-skeleton-xl rounded-md bg-bg-tertiary" />
              <div className="h-skeleton-text w-skeleton-md rounded-md bg-bg-tertiary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state - component-styling-guide.md#1348-1399
  if (error) {
    return (
      <div
        className={cn(
          'flex items-start gap-3',
          'bg-alert-error-bg',
          'text-alert-error-text',
          'border border-alert-error-border',
          'px-4 py-3',
          'rounded-md',
          className
        )}
      >
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-base font-medium leading-relaxed">
            Failed to load context summaries
          </p>
          <p className="mt-1 text-small leading-relaxed text-alert-error-text/80">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!contextSummaries || contextSummaries.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'bg-card',
          'border border-card-border',
          'rounded-card',
          'p-8',
          'text-center',
          className
        )}
      >
        <p className="mb-2 text-base text-text-secondary">No contexts yet</p>
        <p className="text-small text-text-muted">
          Create your first context to get started
        </p>
      </div>
    );
  }

  // Success state - Grid of context cards
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {contextSummaries.map((contextWithSummary) => (
        <ContextSummaryCard
          key={contextWithSummary.context_id}
          contextWithSummary={contextWithSummary}
          onClick={onContextClick}
        />
      ))}
    </div>
  );
}
