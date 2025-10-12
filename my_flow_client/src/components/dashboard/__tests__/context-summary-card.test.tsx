import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContextSummaryCard } from '../context-summary-card';
import type { ContextWithSummary } from '@/types/context-summary';

const mockContextWithSummary: ContextWithSummary = {
  context_id: '1',
  context_name: 'Work',
  context_icon: '💼',
  context_color: '#3b82f6',
  summary: {
    context_id: '1',
    incomplete_flows_count: 8,
    completed_flows_count: 12,
    summary_text:
      'You have 8 incomplete flows in your Work context. Last activity: discussed Q4 roadmap 2 hours ago.',
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    top_priorities: [],
  },
};

describe('ContextSummaryCard', () => {
  it('renders context name, icon, and color', () => {
    const { container } = render(
      <ContextSummaryCard
        contextWithSummary={mockContextWithSummary}
        onClick={vi.fn()}
      />
    );

    // Check name
    expect(screen.getByText('Work')).toBeInTheDocument();

    // Check icon
    expect(screen.getByText('💼')).toBeInTheDocument();

    // Check color (background color on icon container)
    const iconContainer = container.querySelector('.h-10.w-10');
    expect(iconContainer).toHaveStyle({ backgroundColor: '#3b82f6' });
  });

  it('renders flow counts (incomplete and completed)', () => {
    render(
      <ContextSummaryCard
        contextWithSummary={mockContextWithSummary}
        onClick={vi.fn()}
      />
    );

    // Check counts
    expect(screen.getByText('8')).toBeInTheDocument(); // incomplete
    expect(screen.getByText('12')).toBeInTheDocument(); // completed
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    const { container } = render(
      <ContextSummaryCard
        contextWithSummary={mockContextWithSummary}
        onClick={vi.fn()}
      />
    );

    // Check that progress bar text is present
    expect(screen.getByText('12 of 20 completed')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();

    // Check that progress bar fill exists
    const progressFill = container.querySelector('.h-full.rounded-full');
    expect(progressFill).toBeInTheDocument();
  });

  it('renders last activity timestamp (relative format)', () => {
    render(
      <ContextSummaryCard
        contextWithSummary={mockContextWithSummary}
        onClick={vi.fn()}
      />
    );

    // Should show "about 2 hours ago" (exact format from date-fns)
    // Use getAllByText since it appears in both timestamp and summary text
    const elements = screen.getAllByText(/about 2 hours ago/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders AI summary text', () => {
    render(
      <ContextSummaryCard
        contextWithSummary={mockContextWithSummary}
        onClick={vi.fn()}
      />
    );

    expect(
      screen.getByText(/You have 8 incomplete flows/i)
    ).toBeInTheDocument();
  });

  it('calls onClick with context_id when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <ContextSummaryCard
        contextWithSummary={mockContextWithSummary}
        onClick={handleClick}
      />
    );

    // Click on the card (it has cursor-pointer class)
    const card = container.querySelector('.cursor-pointer');
    if (card) {
      fireEvent.click(card);
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('does not render AI summary text if empty or unavailable', () => {
    const contextWithNoSummary: ContextWithSummary = {
      ...mockContextWithSummary,
      summary: {
        ...mockContextWithSummary.summary,
        summary_text: 'No summary available',
      },
    };

    render(
      <ContextSummaryCard
        contextWithSummary={contextWithNoSummary}
        onClick={vi.fn()}
      />
    );

    expect(screen.queryByText(/No summary available/i)).not.toBeInTheDocument();
  });

  it('renders "No activity yet" when last_activity is null', () => {
    const contextWithNoActivity: ContextWithSummary = {
      ...mockContextWithSummary,
      summary: {
        ...mockContextWithSummary.summary,
        last_activity: null,
      },
    };

    render(
      <ContextSummaryCard
        contextWithSummary={contextWithNoActivity}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });
});
