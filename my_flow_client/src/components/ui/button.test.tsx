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
    expect(button.className).toContain('bg-button-primary');
  });

  it('should apply destructive variant styles', () => {
    const className = buttonVariants({ variant: 'destructive' });
    expect(className).toContain('bg-button-danger');
    expect(className).toContain('text-button-text-danger');
    expect(className).toContain('hover:bg-button-danger-hover');
  });

  it('should apply outline variant styles', () => {
    const className = buttonVariants({ variant: 'outline' });
    expect(className).toContain('border-button-border-secondary');
    expect(className).toContain('bg-button-secondary');
    expect(className).toContain('text-button-text-secondary');
  });

  it('should apply secondary variant styles', () => {
    const className = buttonVariants({ variant: 'secondary' });
    expect(className).toContain('bg-bg-secondary');
    expect(className).toContain('text-text-primary');
  });

  it('should apply ghost variant styles', () => {
    const className = buttonVariants({ variant: 'ghost' });
    expect(className).toContain('bg-button-ghost');
    expect(className).toContain('text-button-text-ghost');
  });

  it('should apply link variant styles', () => {
    const className = buttonVariants({ variant: 'link' });
    expect(className).toContain('text-context');
  });

  it('should use CSS design tokens instead of hardcoded colors', () => {
    // Test all variants to ensure they use design tokens via Tailwind utilities
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

      // Should NOT contain hardcoded colors
      expect(className).not.toMatch(/\sbg-blue-\d+/);
      expect(className).not.toMatch(/\sbg-red-\d+/);
      expect(className).not.toMatch(/\stext-white\s/);

      // Should use Tailwind utility classes that map to design tokens
      // (bg-button-primary, text-text-primary, etc.)
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

  it('should use context-current color for focus ring', () => {
    const className = buttonVariants();
    expect(className).toContain('focus-visible:ring-context');
  });

  it('should include hover and active states for primary variant', () => {
    const className = buttonVariants({ variant: 'default' });
    expect(className).toContain('hover:bg-button-primary-hover');
    expect(className).toContain('active:bg-button-primary-active');
  });

  it('should include shadow styles using design tokens', () => {
    const className = buttonVariants({ variant: 'default' });
    expect(className).toContain('shadow-sm');
  });
});
