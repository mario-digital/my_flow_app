'use client';

import type { JSX } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
} from '@/components/ui/select';
import type { Context } from '@/types/context';
import { cn } from '@/lib/utils';

interface ContextSwitcherProps {
  currentContextId: string;
  contexts: Context[];
  onContextChange: (contextId: string) => void;
  className?: string;
}

export function ContextSwitcher({
  currentContextId,
  contexts,
  onContextChange,
  className,
}: ContextSwitcherProps): JSX.Element {
  // Sort contexts by updated_at descending (most recently used first)
  const sortedContexts = [...contexts].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const currentContext = contexts.find((c) => c.id === currentContextId);

  return (
    <Select
      value={currentContext}
      onChange={(ctx: Context) => onContextChange(ctx.id)}
    >
      <SelectTrigger
        className={cn(
          'relative w-full sm:w-[240px] flex items-center justify-between gap-2',
          'rounded-lg px-4 py-2.5',
          'bg-bg-secondary border border-border',
          'text-text-primary',
          'hover:bg-bg-tertiary',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-context focus-visible:ring-offset-2',
          'transition-colors duration-150',
          className
        )}
        aria-label="Select context"
      >
        {currentContext && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xl leading-none" aria-hidden="true">
              {currentContext.icon}
            </span>
            <span className="font-medium truncate">{currentContext.name}</span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 ml-auto"
              style={{ backgroundColor: currentContext.color }}
              aria-hidden="true"
            />
          </div>
        )}
        <ChevronDownIcon
          className="w-5 h-5 text-text-secondary flex-shrink-0"
          aria-hidden="true"
        />
      </SelectTrigger>

      <SelectContent
        className={cn(
          'absolute z-10 mt-1 w-full sm:w-[240px] max-h-60 overflow-auto',
          'rounded-lg border border-border',
          'bg-bg-secondary shadow-lg',
          'focus:outline-none'
        )}
      >
        {sortedContexts.map((context) => (
          <SelectItem
            key={context.id}
            value={context}
            className={({
              focus,
              selected,
            }: {
              focus: boolean;
              selected: boolean;
            }) =>
              cn(
                'relative flex items-center gap-2.5 px-4 py-2.5',
                'cursor-pointer select-none',
                'text-text-primary',
                focus && 'bg-bg-tertiary',
                selected && 'bg-bg-tertiary'
              )
            }
            aria-current={context.id === currentContextId ? 'true' : undefined}
          >
            {({ selected }: { selected: boolean }) => (
              <>
                <span className="text-xl leading-none" aria-hidden="true">
                  {context.icon}
                </span>
                <span
                  className={cn('flex-1 truncate', selected && 'font-semibold')}
                >
                  {context.name}
                </span>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: context.color }}
                  aria-hidden="true"
                />
                {selected && (
                  <CheckIcon
                    className="w-5 h-5 text-context flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
