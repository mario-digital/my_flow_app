import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-context-current)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--button-bg-primary)] text-[var(--button-text-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--button-bg-primary-hover)] active:bg-[var(--button-bg-primary-active)]',
        destructive:
          'bg-[var(--button-bg-danger)] text-[var(--button-text-danger)] shadow-[var(--shadow-sm)] hover:bg-[var(--button-bg-danger-hover)] active:bg-[var(--button-bg-danger-active)]',
        outline:
          'border-2 border-[var(--button-border-secondary)] bg-[var(--button-bg-secondary)] shadow-[var(--shadow-sm)] hover:border-[var(--button-border-secondary-hover)] text-[var(--button-text-secondary)]',
        secondary:
          'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-bg-tertiary)]',
        ghost:
          'bg-[var(--button-bg-ghost)] text-[var(--button-text-ghost)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--button-text-ghost-hover)]',
        link: 'text-[var(--color-context-current)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
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
