import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from './button';

describe('Button', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    render(<Button data-testid="button">Default Button</Button>);
    const button = screen.getByTestId('button');

    // Should have default variant classes
    expect(button.className).toContain('bg-[var(--button-bg-primary)]');
  });

  it('should apply destructive variant styles', () => {
    const className = buttonVariants({ variant: 'destructive' });
    expect(className).toContain('bg-[var(--button-bg-danger)]');
    expect(className).toContain('text-[var(--button-text-danger)]');
    expect(className).toContain('hover:bg-[var(--button-bg-danger-hover)]');
  });

  it('should apply outline variant styles', () => {
    const className = buttonVariants({ variant: 'outline' });
    expect(className).toContain('border-[var(--button-border-secondary)]');
    expect(className).toContain('bg-[var(--button-bg-secondary)]');
    expect(className).toContain('text-[var(--button-text-secondary)]');
  });

  it('should apply secondary variant styles', () => {
    const className = buttonVariants({ variant: 'secondary' });
    expect(className).toContain('bg-[var(--color-bg-secondary)]');
    expect(className).toContain('text-[var(--color-text-primary)]');
  });

  it('should apply ghost variant styles', () => {
    const className = buttonVariants({ variant: 'ghost' });
    expect(className).toContain('bg-[var(--button-bg-ghost)]');
    expect(className).toContain('text-[var(--button-text-ghost)]');
  });

  it('should apply link variant styles', () => {
    const className = buttonVariants({ variant: 'link' });
    expect(className).toContain('text-[var(--color-context-current)]');
  });

  it('should use CSS design tokens instead of hardcoded colors', () => {
    // Test all variants to ensure they use CSS tokens
    const variants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
    ] as const;

    variants.forEach((variant) => {
      const className = buttonVariants({ variant });

      // Should NOT contain hardcoded colors or standalone generic tokens
      expect(className).not.toMatch(/\sbg-blue-\d+/);
      expect(className).not.toMatch(/\sbg-red-\d+/);
      expect(className).not.toMatch(/\stext-white\s/);
      expect(className).not.toMatch(/\sbg-primary\s/); // Generic token (not inside var)

      // Should contain CSS custom property syntax
      expect(className).toMatch(/var\(--/);
    });
  });

  it('should apply size variants correctly', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    sizes.forEach((size) => {
      const className = buttonVariants({ size });
      expect(className).toBeTruthy();
    });
  });

  it('should support asChild prop', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should use context-current color for focus ring', () => {
    const className = buttonVariants();
    expect(className).toContain(
      'focus-visible:ring-[var(--color-context-current)]'
    );
  });

  it('should include hover and active states for primary variant', () => {
    const className = buttonVariants({ variant: 'default' });
    expect(className).toContain('hover:bg-[var(--button-bg-primary-hover)]');
    expect(className).toContain('active:bg-[var(--button-bg-primary-active)]');
  });

  it('should include shadow styles using design tokens', () => {
    const className = buttonVariants({ variant: 'default' });
    expect(className).toContain('shadow-[var(--shadow-sm)]');
  });
});
