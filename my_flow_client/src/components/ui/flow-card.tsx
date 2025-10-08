import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface FlowCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  isCompleted?: boolean;
  className?: string;
}

export function FlowCard({
  children,
  onClick,
  isCompleted,
  className,
}: FlowCardProps): ReactElement {
  return (
    <div
      className={cn(
        // Flow Card base styles (Sally's spec lines 570-606)
        'bg-flow-card-bg text-flow-card-text',
        'border border-flow-card-border',
        // 3px left border (Sally's spec line 580): Tailwind doesn't have border-3, use arbitrary value
        'border-l-[3px] border-l-flow-card-border-left',
        'p-4 rounded-card shadow-card',
        'transition-all duration-fast ease-out',
        onClick && 'cursor-pointer',
        // Hover state
        onClick && 'hover:bg-flow-card-bg-hover hover:shadow-card-hover',
        // Focus state (keyboard navigation)
        'focus-within:border-context focus-within:shadow-focus',
        // Completed state
        isCompleted && 'text-flow-card-text-completed line-through opacity-70',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
