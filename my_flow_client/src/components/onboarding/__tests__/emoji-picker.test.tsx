import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmojiPicker } from '../emoji-picker';

describe('EmojiPicker', () => {
  it('renders all preset emojis', () => {
    const mockOnChange = vi.fn();
    render(<EmojiPicker value="💼" onChange={mockOnChange} />);

    // Should render 20 emoji buttons (4 rows × 5 categories)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(20);
  });

  it('calls onChange when emoji is clicked', () => {
    const mockOnChange = vi.fn();
    render(<EmojiPicker value="💼" onChange={mockOnChange} />);

    // Find and click a different emoji
    const emojiButton = screen.getByRole('button', { name: '🏠' });
    fireEvent.click(emojiButton);

    expect(mockOnChange).toHaveBeenCalledWith('🏠');
  });

  it('shows selected state for current value', () => {
    const mockOnChange = vi.fn();
    render(<EmojiPicker value="💼" onChange={mockOnChange} />);

    // Find the selected button
    const selectedButton = screen.getByRole('button', { name: '💼' });

    // Should have selected state classes
    expect(selectedButton.className).toContain('bg-bg-elevated');
    expect(selectedButton.className).toContain('border-context');
    expect(selectedButton.className).toContain('shadow-focus');
  });

  it('applies hover effects correctly', () => {
    const mockOnChange = vi.fn();
    render(<EmojiPicker value="💼" onChange={mockOnChange} />);

    const emojiButton = screen.getByRole('button', { name: '🏠' });

    // Should have hover classes
    expect(emojiButton.className).toContain('hover:bg-bg-tertiary');
    expect(emojiButton.className).toContain('hover:border-border-hover');
    expect(emojiButton.className).toContain('hover:scale-110');
  });

  it('renders label text', () => {
    const mockOnChange = vi.fn();
    render(<EmojiPicker value="💼" onChange={mockOnChange} />);

    expect(screen.getByText('Choose an icon')).toBeInTheDocument();
  });

  it('uses semantic tokens for styling', () => {
    const mockOnChange = vi.fn();
    render(<EmojiPicker value="💼" onChange={mockOnChange} />);

    const label = screen.getByText('Choose an icon');

    // Should use semantic token classes
    expect(label.className).toContain('text-small');
    expect(label.className).toContain('text-text-primary');
  });
});
