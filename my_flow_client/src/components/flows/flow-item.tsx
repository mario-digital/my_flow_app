'use client';

import type { ReactElement } from 'react';
import { FlowCard } from '@/components/ui/flow-card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical } from 'lucide-react';
import type { Flow } from '@/types/flow';
import { FlowPriority } from '@/types/enums';
import { cn } from '@/lib/utils';

interface FlowItemProps {
  flow: Flow;
  onFlowClick: (flowId: string) => void;
  onFlowComplete: (flowId: string) => void;
  onFlowDelete: (flowId: string) => void;
  className?: string;
}

/**
 * Maps FlowPriority to semantic feedback color classes.
 * Uses soft, subtle transparent backgrounds for a modern look.
 * Colors: error (red), warning (yellow), success (green) - NOT context colors.
 *
 * @see docs/architecture/coding-standards.md#priority-badge-color-mapping
 */
function getPriorityBadgeClasses(priority: FlowPriority): string {
  switch (priority) {
    case FlowPriority.High:
      return 'bg-error/15 text-error border-error/30';
    case FlowPriority.Medium:
      return 'bg-warning/15 text-warning border-warning/30';
    case FlowPriority.Low:
      return 'bg-success/15 text-success border-success/30';
  }
}

/**
 * Truncates description text to maxLength characters.
 * Adds "..." if text is longer than maxLength.
 */
function truncateDescription(
  text: string | undefined,
  maxLength: number
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Formats ISO 8601 date string to readable format.
 * Example: "2025-10-05T10:00:00Z" → "Oct 5, 2025"
 */
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
}

export function FlowItem({
  flow,
  onFlowClick,
  onFlowComplete,
  onFlowDelete,
  className,
}: FlowItemProps): ReactElement {
  return (
    <FlowCard
      onClick={() => onFlowClick(flow.id)}
      isCompleted={flow.is_completed}
      className={className}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox (20px icon, left-aligned) */}
        <Checkbox
          checked={flow.is_completed}
          onCheckedChange={() => onFlowComplete(flow.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 mt-0.5"
          aria-label="Mark flow as complete"
        />

        <div className="flex-1">
          {/* Flow title (text-base 16px, font-medium) */}
          <h3 className="text-base font-medium leading-normal mb-1">
            {flow.title}
          </h3>

          {/* Flow description (text-small 14px, text-secondary) */}
          {flow.description && (
            <p className="text-small text-text-secondary leading-relaxed mb-2">
              {truncateDescription(flow.description, 150)}
            </p>
          )}

          {/* Metadata: created date + priority badge (text-tiny 12px, text-muted) */}
          <div className="flex items-center gap-3 text-tiny text-text-muted">
            <span>Created {formatDate(flow.created_at)}</span>
            <span>•</span>
            <Badge
              className={cn(
                'text-tiny font-medium px-2 py-1',
                getPriorityBadgeClasses(flow.priority)
              )}
            >
              {flow.priority}
            </Badge>
          </div>
        </div>

        {/* Actions dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Flow actions"
          >
            <MoreVertical className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-bg-secondary border-border-default">
            <DropdownMenuItem onClick={() => onFlowClick(flow.id)}>
              Edit
            </DropdownMenuItem>
            {!flow.is_completed && (
              <DropdownMenuItem onClick={() => onFlowComplete(flow.id)}>
                Mark Complete
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onFlowDelete(flow.id);
              }}
              className="text-error"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </FlowCard>
  );
}
