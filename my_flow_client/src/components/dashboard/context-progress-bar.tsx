'use client';

import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

export interface ContextProgressBarProps {
  /** Number of completed flows */
  completed: number;

  /** Number of incomplete flows */
  incomplete: number;

  /** Hex color for context (e.g., "#3b82f6") */
  contextColor: string;

  className?: string;
}

export function ContextProgressBar({
  completed,
  incomplete,
  contextColor,
  className,
}: ContextProgressBarProps): ReactElement {
  const total = completed + incomplete;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress stats */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-tiny text-text-secondary">
          {completed} of {total} completed
        </span>
        <span className="text-tiny font-medium text-text-primary">
          {percentage}%
        </span>
      </div>

      {/* Progress bar - component-styling-guide.md#528-569 */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className="h-full rounded-full transition-all duration-normal ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: contextColor,
          }}
        />
      </div>
    </div>
  );
}
