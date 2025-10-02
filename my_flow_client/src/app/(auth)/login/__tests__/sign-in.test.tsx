import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignIn } from '../sign-in';

describe('SignIn', () => {
  it('should render sign in button', () => {
    const mockAction = vi.fn();

    render(<SignIn action={mockAction} />);

    const button = screen.getByRole('button', { name: /sign in with logto/i });
    expect(button).toBeInstanceOf(HTMLButtonElement);
  });

  it('should call action when form is submitted', () => {
    const mockAction = vi.fn();

    render(<SignIn action={mockAction} />);

    const button = screen.getByRole('button', { name: /sign in with logto/i });
    const form = button.closest('form');

    expect(form).toBeInstanceOf(HTMLFormElement);

    if (form) {
      fireEvent.submit(form);
      expect(mockAction).toHaveBeenCalledTimes(1);
    }
  });

  it('should render button with full width class', () => {
    const mockAction = vi.fn();

    render(<SignIn action={mockAction} />);

    const button = screen.getByRole('button', { name: /sign in with logto/i });
    expect(button.className).toContain('w-full');
  });

  it('should render button with submit type', () => {
    const mockAction = vi.fn();

    render(<SignIn action={mockAction} />);

    const button = screen.getByRole('button', {
      name: /sign in with logto/i,
    }) as HTMLButtonElement;
    expect(button.type).toBe('submit');
  });
});
