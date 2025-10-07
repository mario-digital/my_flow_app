import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-base font-medium leading-normal transition-all duration-fast ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary Button - Neutral with glow (per Component Styling Guide)
        default:
          'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-elevated hover:border-context-current active:scale-[0.98] disabled:bg-bg-secondary disabled:text-text-disabled disabled:border-border-subtle',
        // Secondary Button - Outlined
        secondary:
          'bg-transparent text-text-primary border border-border-default hover:border-context-current active:scale-[0.98] disabled:text-text-disabled disabled:border-border-subtle',
        // Ghost Button - Minimal
        ghost:
          'bg-transparent text-text-secondary px-4 py-2 hover:bg-bg-tertiary hover:text-text-primary active:bg-bg-elevated active:scale-[0.98] disabled:text-text-disabled',
        // Danger Button - Destructive actions
        destructive:
          'bg-transparent text-error border border-error hover:bg-error-bg active:scale-[0.98]',
        // Context Button - Only for context-switching actions
        context:
          'bg-context-current text-white border-0 font-semibold hover:bg-context-hover hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98]',
        // Link variant
        link: 'text-context-current underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-3',
        sm: 'h-9 px-4 py-2 text-sm',
        lg: 'h-12 px-8 py-3 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
