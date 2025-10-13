import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../color-picker';

describe('ColorPicker', () => {
  it('renders all preset colors', () => {
    const mockOnChange = vi.fn();
    const { container } = render(
      <ColorPicker value="#3b82f6" onChange={mockOnChange} />
    );

    // Should render 8 color buttons
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(8);
  });

  it('calls onChange when color is clicked', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#3b82f6" onChange={mockOnChange} />);

    // Click the green color button
    const greenButton = screen.getByRole('button', { name: 'Select Green' });
    fireEvent.click(greenButton);

    expect(mockOnChange).toHaveBeenCalledWith('#10b981');
  });

  it('shows checkmark for selected color', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#3b82f6" onChange={mockOnChange} />);

    const selectedButton = screen.getByRole('button', { name: 'Select Blue' });

    // Should have selected border state
    expect(selectedButton.className).toContain('border-text-primary');

    // Should have checkmark icon
    const checkmark = selectedButton.querySelector('svg');
    expect(checkmark).toBeInTheDocument();
  });

  it('uses dynamic backgroundColor style prop', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#3b82f6" onChange={mockOnChange} />);

    const blueButton = screen.getByRole('button', { name: 'Select Blue' });

    // Should have inline style with backgroundColor
    expect(blueButton.style.backgroundColor).toBe('rgb(59, 130, 246)'); // #3b82f6
  });

  it('renders label text', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#3b82f6" onChange={mockOnChange} />);

    expect(screen.getByText('Choose a color')).toBeInTheDocument();
  });

  it('has proper aria-labels', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#3b82f6" onChange={mockOnChange} />);

    expect(
      screen.getByRole('button', { name: 'Select Blue' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Select Green' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Select Purple' })
    ).toBeInTheDocument();
  });

  it('applies hover effects correctly', () => {
    const mockOnChange = vi.fn();
    render(<ColorPicker value="#3b82f6" onChange={mockOnChange} />);

    const colorButton = screen.getByRole('button', { name: 'Select Green' });

    // Should have hover classes
    expect(colorButton.className).toContain('hover:scale-110');
    expect(colorButton.className).toContain('hover:border-text-secondary');
  });
});
