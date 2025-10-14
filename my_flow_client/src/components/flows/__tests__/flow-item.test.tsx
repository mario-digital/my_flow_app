import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowItem } from '../flow-item';
import { FlowPriority } from '@/types/enums';
import type { Flow } from '@/types/flow';

const mockFlow: Flow = {
  id: 'flow-1',
  context_id: 'ctx-work-123',
  user_id: 'user-1',
  title: 'Test Flow Title',
  description: 'This is a test description for the flow.',
  priority: FlowPriority.High,
  is_completed: false,
  due_date: '2025-10-15T17:00:00Z',
  reminder_enabled: true,
  created_at: '2025-10-05T10:00:00Z',
  updated_at: '2025-10-05T10:00:00Z',
};

describe('FlowItem', () => {
  const mockCallbacks = {
    onFlowClick: vi.fn(),
    onFlowComplete: vi.fn(),
    onFlowDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders flow title', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    expect(screen.getByText('Test Flow Title')).toBeTruthy();
  });

  it('renders flow description', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    expect(screen.getByText(/This is a test description/)).toBeTruthy();
  });

  it('renders created date', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    expect(screen.getByText(/Created Oct 5, 2025/)).toBeTruthy();
  });

  it('renders priority badge with correct text', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    expect(screen.getByText('high')).toBeTruthy();
  });

  it('shows high priority badge with error color class', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    const badge = screen.getByText('high').closest('div');
    expect(badge).toHaveClass('text-error');
  });

  it('shows medium priority badge with warning color class', () => {
    const mediumFlow = { ...mockFlow, priority: FlowPriority.Medium };
    render(<FlowItem flow={mediumFlow} {...mockCallbacks} />);

    const badge = screen.getByText('medium').closest('div');
    expect(badge).toHaveClass('text-warning');
  });

  it('shows low priority badge with success color class', () => {
    const lowFlow = { ...mockFlow, priority: FlowPriority.Low };
    render(<FlowItem flow={lowFlow} {...mockCallbacks} />);

    const badge = screen.getByText('low').closest('div');
    expect(badge).toHaveClass('text-success');
  });

  it('renders checkbox unchecked when flow is not completed', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checkbox checked when flow is completed', () => {
    const completedFlow = { ...mockFlow, is_completed: true };
    render(<FlowItem flow={completedFlow} {...mockCallbacks} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onFlowClick when card is clicked', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    const card = screen.getByRole('button', { name: /test flow title/i });
    fireEvent.click(card);

    expect(mockCallbacks.onFlowClick).toHaveBeenCalledWith('flow-1');
    expect(mockCallbacks.onFlowClick).toHaveBeenCalledTimes(1);
  });

  it('calls onFlowComplete when checkbox is clicked', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockCallbacks.onFlowComplete).toHaveBeenCalledWith('flow-1');
  });

  it('does not call onFlowClick when checkbox is clicked', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockCallbacks.onFlowClick).not.toHaveBeenCalled();
  });

  it('truncates long descriptions to 150 characters', () => {
    const longDescription = 'A'.repeat(200);
    const longFlow = { ...mockFlow, description: longDescription };
    render(<FlowItem flow={longFlow} {...mockCallbacks} />);

    const description = screen.getByText(/A+\.\.\./);
    expect(description.textContent?.length).toBeLessThanOrEqual(153); // 150 chars + "..."
  });

  it('does not truncate short descriptions', () => {
    const shortDescription = 'Short description';
    const shortFlow = { ...mockFlow, description: shortDescription };
    render(<FlowItem flow={shortFlow} {...mockCallbacks} />);

    expect(screen.getByText('Short description')).toBeTruthy();
  });

  it('renders without description when not provided', () => {
    const noDescFlow = { ...mockFlow, description: undefined };
    render(<FlowItem flow={noDescFlow} {...mockCallbacks} />);

    expect(screen.getByText('Test Flow Title')).toBeTruthy();
    // Description should not be rendered
    const descriptions = screen.queryByText(/This is a test/);
    expect(descriptions).toBeNull();
  });

  it('renders actions dropdown menu trigger', () => {
    render(<FlowItem flow={mockFlow} {...mockCallbacks} />);

    const dropdownTrigger = screen.getByRole('button', {
      name: /flow actions/i,
    });
    expect(dropdownTrigger).toBeTruthy();
  });
});
