'use client';

import type { ReactElement } from 'react';
import { FlowItem } from './flow-item';
import type { Flow } from '@/types/flow';
import { cn } from '@/lib/utils';

interface FlowListProps {
  flows: Flow[];
  onFlowClick: (flowId: string) => void;
  onFlowComplete: (flowId: string) => void;
  onFlowDelete: (flowId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Skeleton loader card for loading state.
 * Matches FlowItem card dimensions with pulsing animation.
 */
function SkeletonCard(): ReactElement {
  return (
    <div className="animate-pulse bg-card border-card-border rounded-card p-4 space-y-3">
      <div className="h-6 bg-bg-tertiary rounded w-3/4"></div>
      <div className="h-4 bg-bg-tertiary rounded w-full"></div>
      <div className="h-4 bg-bg-tertiary rounded w-5/6"></div>
    </div>
  );
}

/**
 * Empty state component shown when no flows exist.
 * Shows emoji icon with message to create first flow.
 */
function EmptyState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        No flows yet
      </h3>
      <p className="text-sm text-text-secondary">
        Create your first flow to get started
      </p>
    </div>
  );
}

/**
 * FlowList component displays a list of flows with loading and empty states.
 *
 * @param flows - Array of Flow objects to display
 * @param onFlowClick - Callback when flow card is clicked (edit/view)
 * @param onFlowComplete - Callback when flow is marked complete
 * @param onFlowDelete - Callback when flow is deleted
 * @param isLoading - Shows skeleton loaders when true
 * @param className - Optional additional CSS classes
 */
export function FlowList({
  flows,
  onFlowClick,
  onFlowComplete,
  onFlowDelete,
  isLoading = false,
  className,
}: FlowListProps): ReactElement {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (flows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {flows.map((flow) => (
        <FlowItem
          key={flow.id}
          flow={flow}
          onFlowClick={onFlowClick}
          onFlowComplete={onFlowComplete}
          onFlowDelete={onFlowDelete}
        />
      ))}
    </div>
  );
}
