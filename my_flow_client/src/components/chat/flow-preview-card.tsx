'use client';

import type { ReactElement } from 'react';
import type { Flow } from '@/types/flow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getPriorityColor,
  getPriorityBgColor,
  getPriorityLabel,
  truncateText,
} from '@/lib/flow-utils';

/**
 * Props for the FlowPreviewCard component.
 * Mini card for displaying flow preview in extraction notification.
 */
interface FlowPreviewCardProps {
  /** Flow data to display */
  flow: Flow;

  /** Optional hover callback */
  onHover?: () => void;

  /** Optional className for styling */
  className?: string;
}

/**
 * FlowPreviewCard Component
 *
 * Mini flow card showing title, description, and priority badge.
 * Used in flow extraction notification to preview extracted flows.
 * Hover shows full description via native browser tooltip.
 *
 * @example
 * ```tsx
 * <FlowPreviewCard flow={extractedFlow} />
 * ```
 */
export function FlowPreviewCard({
  flow,
  onHover,
  className,
}: FlowPreviewCardProps): ReactElement {
  const priorityColor = getPriorityColor(flow.priority);
  const priorityBgColor = getPriorityBgColor(flow.priority);
  const priorityLabel = getPriorityLabel(flow.priority);

  // Truncate title and description for preview
  const truncatedTitle = truncateText(flow.title, 50);
  const truncatedDescription = flow.description
    ? truncateText(flow.description, 100)
    : 'No description';

  return (
    <div
      className={cn(
        'bg-card border border-card-border rounded-card p-3',
        'hover:bg-card-hover transition-colors duration-fast cursor-pointer',
        className
      )}
      onMouseEnter={onHover}
      title={`${flow.title}${flow.description ? `\n\n${flow.description}` : ''}`}
      role="article"
      aria-label={`Flow: ${flow.title}`}
    >
      {/* Flow Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-base font-semibold text-text-primary leading-tight flex-1">
          {truncatedTitle}
        </h4>

        {/* Priority Badge */}
        <Badge
          className={cn(
            'px-2 py-0.5 text-xs font-medium shrink-0',
            priorityBgColor,
            priorityColor
          )}
        >
          {priorityLabel}
        </Badge>
      </div>

      {/* Flow Description */}
      <p className="text-small text-text-secondary leading-relaxed">
        {truncatedDescription}
      </p>
    </div>
  );
}
