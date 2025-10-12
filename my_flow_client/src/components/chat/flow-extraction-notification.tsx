'use client';

import { useState, type ReactElement } from 'react';
import type { FlowExtractionNotificationProps } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { FlowPreviewCard } from './flow-preview-card';
import { cn } from '@/lib/utils';

/**
 * FlowExtractionNotification Component
 *
 * Inline notification banner that appears when AI extracts flows from conversation.
 * Users can preview extracted flows and choose to accept or dismiss them.
 *
 * Features:
 * - Expandable/collapsible flow preview
 * - Responsive grid layout (2 columns desktop, 1 column mobile)
 * - Accessibility with ARIA live regions
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <FlowExtractionNotification
 *   flows={extractedFlows}
 *   onAccept={handleAccept}
 *   onDismiss={handleDismiss}
 *   contextId={contextId}
 * />
 * ```
 */
export function FlowExtractionNotification({
  flows,
  onAccept,
  onDismiss,
  className,
}: FlowExtractionNotificationProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const flowCount = flows.length;
  const flowWord = flowCount === 1 ? 'flow' : 'flows';

  return (
    <div
      className={cn(
        'bg-bg-secondary border border-border rounded-lg p-4 shadow-card',
        'transition-all duration-fast ease-out',
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-3 mb-3',
          'text-left focus:outline-none focus:ring-2 focus:ring-context rounded',
          'transition-colors hover:text-context'
        )}
        aria-expanded={isExpanded}
        aria-controls="flow-preview-list"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🎯
          </span>
          <span className="text-base font-semibold text-text-primary">
            Extracted {flowCount} {flowWord} from conversation
          </span>
        </div>

        {/* Expand/Collapse Icon */}
        <svg
          className={cn(
            'w-5 h-5 text-text-secondary transition-transform duration-fast',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Flow Preview Grid - Expandable */}
      <div
        id="flow-preview-list"
        className={cn(
          'overflow-hidden transition-all duration-fast ease-out',
          isExpanded ? 'max-h-96 mb-3' : 'max-h-0'
        )}
      >
        <div
          className={cn(
            'grid gap-3 overflow-y-auto',
            'grid-cols-1 md:grid-cols-2',
            'max-h-96 pr-1'
          )}
        >
          {flows.map((flow) => (
            <FlowPreviewCard key={flow.id} flow={flow} />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={onAccept}
          variant="default"
          size="sm"
          className="bg-button-primary text-button-text-primary hover:bg-button-primary-hover"
        >
          Add All
        </Button>
        <Button
          onClick={onDismiss}
          variant="secondary"
          size="sm"
          className="text-text-secondary hover:bg-bg-tertiary"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
