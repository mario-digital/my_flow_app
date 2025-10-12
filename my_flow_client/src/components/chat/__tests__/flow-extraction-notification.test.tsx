import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FlowExtractionNotification } from '../flow-extraction-notification';
import { FlowPriority } from '@/types/enums';
import type { Flow } from '@/types/flow';

describe('FlowExtractionNotification', () => {
  const mockFlows: Flow[] = [
    {
      id: 'flow-1',
      context_id: 'ctx-1',
      user_id: 'user-1',
      title: 'Review Q4 planning document',
      description: 'Check budget allocations',
      priority: FlowPriority.High,
      is_completed: false,
      reminder_enabled: true,
      created_at: '2025-10-12T10:00:00Z',
      updated_at: '2025-10-12T10:00:00Z',
    },
    {
      id: 'flow-2',
      context_id: 'ctx-1',
      user_id: 'user-1',
      title: 'Update team roster',
      description: 'Add new hires',
      priority: FlowPriority.Medium,
      is_completed: false,
      reminder_enabled: false,
      created_at: '2025-10-12T10:00:00Z',
      updated_at: '2025-10-12T10:00:00Z',
    },
    {
      id: 'flow-3',
      context_id: 'ctx-1',
      user_id: 'user-1',
      title: 'Schedule team meeting',
      description: 'Find suitable time slot',
      priority: FlowPriority.Low,
      is_completed: false,
      reminder_enabled: true,
      created_at: '2025-10-12T10:00:00Z',
      updated_at: '2025-10-12T10:00:00Z',
    },
  ];

  const mockOnAccept = vi.fn();
  const mockOnDismiss = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct flow count', () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    expect(
      screen.getByText(/Extracted 3 flows from conversation/i)
    ).toBeInTheDocument();
  });

  it('uses singular "flow" for single flow', () => {
    render(
      <FlowExtractionNotification
        flows={[mockFlows[0]!]}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    expect(
      screen.getByText(/Extracted 1 flow from conversation/i)
    ).toBeInTheDocument();
  });

  it('is initially collapsed', () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const previewList = screen.getByRole('button', {
      name: /extracted 3 flows/i,
    });
    expect(previewList).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands when header is clicked', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const header = screen.getByRole('button', {
      name: /extracted 3 flows/i,
    });

    fireEvent.click(header);

    await waitFor(() => {
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('shows flow preview cards when expanded', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const header = screen.getByRole('button', {
      name: /extracted 3 flows/i,
    });

    fireEvent.click(header);

    await waitFor(() => {
      expect(
        screen.getByText('Review Q4 planning document')
      ).toBeInTheDocument();
      expect(screen.getByText('Update team roster')).toBeInTheDocument();
      expect(screen.getByText('Schedule team meeting')).toBeInTheDocument();
    });
  });

  it('collapses when header is clicked again', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const header = screen.getByRole('button', {
      name: /extracted 3 flows/i,
    });

    // Expand
    fireEvent.click(header);
    await waitFor(() => {
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    // Collapse
    fireEvent.click(header);
    await waitFor(() => {
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('calls onAccept when "Add All" button is clicked', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const addAllButton = screen.getByRole('button', { name: /add all/i });
    fireEvent.click(addAllButton);

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledOnce();
    });
  });

  it('calls onDismiss when "Dismiss" button is clicked', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledOnce();
    });
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const notification = container.querySelector('[role="status"]');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveAttribute('aria-live', 'polite');
    expect(notification).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders all flow preview cards with different priorities', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const header = screen.getByRole('button', {
      name: /extracted 3 flows/i,
    });
    fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  it('handles empty flow list', () => {
    render(
      <FlowExtractionNotification
        flows={[]}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    expect(screen.getByText(/Extracted 0 flows/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
        className="custom-notification"
      />
    );

    const notification = container.querySelector('[role="status"]');
    expect(notification).toHaveClass('custom-notification');
  });

  it('has expand/collapse icon that rotates', async () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const header = screen.getByRole('button', {
      name: /extracted 3 flows/i,
    });
    const icon = header.querySelector('svg');

    expect(icon).not.toHaveClass('rotate-180');

    fireEvent.click(header);

    await waitFor(() => {
      expect(icon).toHaveClass('rotate-180');
    });
  });

  it('renders with 5 flows', async () => {
    const manyFlows: Flow[] = [
      ...mockFlows,
      {
        id: 'flow-4',
        context_id: 'ctx-1',
        user_id: 'user-1',
        title: 'Fourth flow',
        priority: FlowPriority.High,
        is_completed: false,
        reminder_enabled: false,
        created_at: '2025-10-12T10:00:00Z',
        updated_at: '2025-10-12T10:00:00Z',
      },
      {
        id: 'flow-5',
        context_id: 'ctx-1',
        user_id: 'user-1',
        title: 'Fifth flow',
        priority: FlowPriority.Low,
        is_completed: false,
        reminder_enabled: false,
        created_at: '2025-10-12T10:00:00Z',
        updated_at: '2025-10-12T10:00:00Z',
      },
    ];

    render(
      <FlowExtractionNotification
        flows={manyFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    expect(screen.getByText(/Extracted 5 flows/i)).toBeInTheDocument();

    const header = screen.getByRole('button', {
      name: /extracted 5 flows/i,
    });
    fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByText('Fourth flow')).toBeInTheDocument();
      expect(screen.getByText('Fifth flow')).toBeInTheDocument();
    });
  });

  it('has correct button styling', () => {
    render(
      <FlowExtractionNotification
        flows={mockFlows}
        onAccept={mockOnAccept}
        onDismiss={mockOnDismiss}
        contextId="ctx-1"
      />
    );

    const addAllButton = screen.getByRole('button', { name: /add all/i });
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });

    expect(addAllButton).toHaveClass('bg-button-primary');
    expect(dismissButton).toHaveClass('text-text-secondary');
  });
});
