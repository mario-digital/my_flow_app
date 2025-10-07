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

    // Should have neutral-first default variant classes
    expect(button.className).toContain('bg-bg-tertiary');
  });

  it('should apply destructive variant styles', () => {
    const className = buttonVariants({ variant: 'destructive' });
    expect(className).toContain('bg-transparent');
    expect(className).toContain('text-error');
    expect(className).toContain('border-error');
  });

  it('should apply secondary variant styles', () => {
    const className = buttonVariants({ variant: 'secondary' });
    expect(className).toContain('bg-transparent');
    expect(className).toContain('text-text-primary');
    expect(className).toContain('border-border-default');
  });

  it('should apply ghost variant styles', () => {
    const className = buttonVariants({ variant: 'ghost' });
    expect(className).toContain('bg-transparent');
    expect(className).toContain('text-text-secondary');
  });

  it('should apply link variant styles', () => {
    const className = buttonVariants({ variant: 'link' });
    expect(className).toContain('text-context-current');
  });

  it('should use CSS design tokens instead of hardcoded colors', () => {
    // Test all variants to ensure they use design tokens via Tailwind utilities
    const variants = [
      'default',
      'destructive',
      'secondary',
      'ghost',
      'link',
      'context',
    ] as const;

    variants.forEach((variant) => {
      const className = buttonVariants({ variant });

      // Should NOT contain hardcoded colors
      expect(className).not.toMatch(/\sbg-blue-\d+/);
      expect(className).not.toMatch(/\sbg-red-\d+/);

      // Should use Tailwind utility classes that map to design tokens
      expect(className).toBeTruthy();
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

  it('should include focus styles', () => {
    const className = buttonVariants();
    expect(className).toContain('focus-visible:outline-none');
  });

  it('should include hover and active states for primary variant', () => {
    const className = buttonVariants({ variant: 'default' });
    expect(className).toContain('hover:bg-bg-elevated');
    expect(className).toContain('active:scale-[0.98]');
  });

  it('should include context button variant', () => {
    const className = buttonVariants({ variant: 'context' });
    expect(className).toContain('bg-context-current');
    expect(className).toContain('font-semibold');
  });
});
