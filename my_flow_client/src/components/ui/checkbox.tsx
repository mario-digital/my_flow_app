'use client';

import type {
  ElementRef as ReactElementRef,
  ComponentPropsWithoutRef,
} from 'react';
import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@radix-ui/react-icons';

const Checkbox = forwardRef<
  ReactElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Modern soft checkbox styling
      'peer h-4 w-4 shrink-0 rounded-sm',
      'border border-border-default bg-bg-secondary',
      'transition-all duration-200',
      // Hover state
      'hover:border-border-hover hover:bg-bg-tertiary',
      // Focus state - subtle glow
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-context-current)]/30',
      // Checked state - soft with context color
      'data-[state=checked]:bg-[var(--color-context-current)]/15',
      'data-[state=checked]:border-[var(--color-context-current)]',
      'data-[state=checked]:text-[var(--color-context-current)]',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <CheckIcon className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
