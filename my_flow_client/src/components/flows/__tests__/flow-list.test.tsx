import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowList } from '../flow-list';
import { FlowPriority } from '@/types/enums';
import type { Flow } from '@/types/flow';

const mockFlows: Flow[] = [
  {
    id: 'flow-1',
    context_id: 'ctx-work-123',
    user_id: 'user-1',
    title: 'Complete quarterly report',
    description:
      'Analyze Q3 metrics and prepare presentation for stakeholders.',
    priority: FlowPriority.High,
    is_completed: false,
    due_date: '2025-10-15T17:00:00Z',
    reminder_enabled: true,
    created_at: '2025-10-05T10:00:00Z',
    updated_at: '2025-10-05T10:00:00Z',
  },
  {
    id: 'flow-2',
    context_id: 'ctx-work-123',
    user_id: 'user-1',
    title: 'Review pull requests',
    description: 'Review and merge pending PRs from team members',
    priority: FlowPriority.Medium,
    is_completed: true,
    reminder_enabled: false,
    created_at: '2025-10-03T14:30:00Z',
    updated_at: '2025-10-04T09:15:00Z',
    completed_at: '2025-10-04T09:15:00Z',
  },
  {
    id: 'flow-3',
    context_id: 'ctx-work-123',
    user_id: 'user-1',
    title: 'Update documentation',
    priority: FlowPriority.Low,
    is_completed: false,
    reminder_enabled: false,
    created_at: '2025-10-01T08:00:00Z',
    updated_at: '2025-10-01T08:00:00Z',
  },
];

describe('FlowList', () => {
  const mockCallbacks = {
    onFlowClick: vi.fn(),
    onFlowComplete: vi.fn(),
    onFlowDelete: vi.fn(),
  };

  it('renders flow items when flows provided', () => {
    render(<FlowList flows={mockFlows} {...mockCallbacks} />);

    expect(screen.getByText('Complete quarterly report')).toBeTruthy();
    expect(screen.getByText('Review pull requests')).toBeTruthy();
    expect(screen.getByText('Update documentation')).toBeTruthy();
  });

  it('renders all 3 flow items', () => {
    render(<FlowList flows={mockFlows} {...mockCallbacks} />);

    const flowTitles = screen.getAllByRole('button');
    // Each flow has a card (button role) + dropdown trigger
    expect(flowTitles.length).toBeGreaterThanOrEqual(3);
  });

  it('shows empty state when flows array is empty', () => {
    render(<FlowList flows={[]} {...mockCallbacks} />);

    expect(screen.getByText('No flows yet')).toBeTruthy();
    expect(
      screen.getByText('Create your first flow to get started')
    ).toBeTruthy();
  });

  it('shows skeleton loaders when isLoading is true', () => {
    const { container } = render(
      <FlowList flows={[]} {...mockCallbacks} isLoading={true} />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('does not show flows when isLoading is true', () => {
    render(<FlowList flows={mockFlows} {...mockCallbacks} isLoading={true} />);

    expect(screen.queryByText('Complete quarterly report')).toBeNull();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FlowList flows={mockFlows} {...mockCallbacks} className="custom-class" />
    );

    const listContainer = container.firstChild;
    expect(listContainer).toHaveClass('custom-class');
  });

  it('renders flows with descriptions', () => {
    render(<FlowList flows={mockFlows} {...mockCallbacks} />);

    expect(screen.getByText(/Analyze Q3 metrics/)).toBeTruthy();
    expect(screen.getByText(/Review and merge pending PRs/)).toBeTruthy();
  });

  it('renders flow without description', () => {
    render(<FlowList flows={mockFlows} {...mockCallbacks} />);

    // Flow 3 has no description, should still render with just title
    expect(screen.getByText('Update documentation')).toBeTruthy();
  });
});
