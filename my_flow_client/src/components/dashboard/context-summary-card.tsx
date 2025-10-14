'use client';

import type { ReactElement } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextProgressBar } from './context-progress-bar';
import type { ContextWithSummary } from '@/types/context-summary';
import { cn } from '@/lib/utils';

export interface ContextSummaryCardProps {
  contextWithSummary: ContextWithSummary;
  onClick: (contextId: string) => void;
  isActive?: boolean;
  className?: string;
}

export function ContextSummaryCard({
  contextWithSummary,
  onClick,
  isActive = false,
  className,
}: ContextSummaryCardProps): ReactElement {
  const { context_id, context_name, context_icon, context_color, summary } =
    contextWithSummary;

  const formattedLastActivity = summary.last_activity
    ? formatDistanceToNow(new Date(summary.last_activity), { addSuffix: true })
    : 'No activity yet';

  return (
    <Card
      className={cn(
        // Base card styling - component-styling-guide.md#528-569
        'bg-card',
        'text-card-text',
        'border-card-border',
        'rounded-card',
        'shadow-card',

        // Interactive styling
        'cursor-pointer',
        'transition-all duration-fast ease-out',
        'hover:bg-card-bg-hover hover:shadow-card-hover',
        'hover:-translate-y-0.5',

        className
      )}
      style={
        isActive
          ? ({
              borderTopColor: context_color,
              borderTopWidth: '3px',
            } as React.CSSProperties)
          : undefined
      }
      onClick={() => onClick(context_id)}
    >
      {/* Card Header - component-styling-guide.md#634-647 */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Context icon and color indicator */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: context_color }}
          >
            {context_icon}
          </div>

          {/* Context name */}
          <CardTitle className="text-base font-semibold text-text-primary">
            {context_name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Flow counts */}
        <div className="grid grid-cols-2 gap-4">
          {/* Incomplete flows */}
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-text-secondary" />
            <div>
              <p className="text-small font-medium text-text-primary">
                {summary.incomplete_flows_count}
              </p>
              <p className="text-tiny text-text-muted">Incomplete</p>
            </div>
          </div>

          {/* Completed flows */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <div>
              <p className="text-small font-medium text-text-primary">
                {summary.completed_flows_count}
              </p>
              <p className="text-tiny text-text-muted">Completed</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <ContextProgressBar
          completed={summary.completed_flows_count}
          incomplete={summary.incomplete_flows_count}
          contextColor={context_color}
        />

        {/* Last activity */}
        <div className="flex items-center gap-2 text-tiny text-text-muted">
          <Clock className="h-4 w-4" />
          <span>{formattedLastActivity}</span>
        </div>

        {/* AI summary text (optional, only if non-empty) */}
        {summary.summary_text &&
          summary.summary_text !== 'No summary available' && (
            <p className="line-clamp-2 text-small leading-relaxed text-text-secondary">
              {summary.summary_text}
            </p>
          )}
      </CardContent>
    </Card>
  );
}
