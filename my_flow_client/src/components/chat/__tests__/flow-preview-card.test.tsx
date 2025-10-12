import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FlowPreviewCard } from '../flow-preview-card';
import { FlowPriority } from '@/types/enums';
import type { Flow } from '@/types/flow';

describe('FlowPreviewCard', () => {
  const mockFlow: Flow = {
    id: 'flow-1',
    context_id: 'ctx-1',
    user_id: 'user-1',
    title: 'Review Q4 planning document',
    description: 'Check budget allocations and team headcount',
    priority: FlowPriority.High,
    is_completed: false,
    reminder_enabled: true,
    created_at: '2025-10-12T10:00:00Z',
    updated_at: '2025-10-12T10:00:00Z',
  };

  it('renders flow title', () => {
    render(<FlowPreviewCard flow={mockFlow} />);
    expect(screen.getByText('Review Q4 planning document')).toBeInTheDocument();
  });

  it('renders priority badge with correct label', () => {
    render(<FlowPreviewCard flow={mockFlow} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<FlowPreviewCard flow={mockFlow} />);
    expect(
      screen.getByText('Check budget allocations and team headcount')
    ).toBeInTheDocument();
  });

  it('shows "No description" when description is missing', () => {
    const flowWithoutDescription: Flow = {
      ...mockFlow,
      description: undefined,
    };
    render(<FlowPreviewCard flow={flowWithoutDescription} />);
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('truncates long title to 50 characters', () => {
    const longTitleFlow: Flow = {
      ...mockFlow,
      title:
        'This is a very long title that should be truncated to exactly fifty characters and beyond',
    };
    render(<FlowPreviewCard flow={longTitleFlow} />);
    const titleElement = screen.getByRole('article');
    expect(titleElement.getAttribute('title')).toContain(longTitleFlow.title);
    // Check that displayed text is truncated
    expect(
      screen.getByText(/This is a very long title that should be truncated.../)
    ).toBeInTheDocument();
  });

  it('truncates long description to 100 characters', () => {
    const longDescriptionFlow: Flow = {
      ...mockFlow,
      description:
        'This is a very long description that exceeds one hundred characters and should be truncated with an ellipsis at the end of the truncation to indicate there is more content available in the full description',
    };
    render(<FlowPreviewCard flow={longDescriptionFlow} />);
    // Description should be truncated in display
    const descriptionText = screen.getByText(
      /This is a very long description.../
    );
    expect(descriptionText.textContent?.length).toBeLessThan(105); // 100 + "..."
  });

  it('applies correct priority color classes for high priority', () => {
    render(
      <FlowPreviewCard flow={{ ...mockFlow, priority: FlowPriority.High }} />
    );
    const badge = screen.getByText('High');
    expect(badge).toHaveClass('text-error');
    expect(badge).toHaveClass('bg-error/10');
  });

  it('applies correct priority color classes for medium priority', () => {
    render(
      <FlowPreviewCard flow={{ ...mockFlow, priority: FlowPriority.Medium }} />
    );
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('text-context');
    expect(badge).toHaveClass('bg-context/10');
  });

  it('applies correct priority color classes for low priority', () => {
    render(
      <FlowPreviewCard flow={{ ...mockFlow, priority: FlowPriority.Low }} />
    );
    const badge = screen.getByText('Low');
    expect(badge).toHaveClass('text-text-muted');
    expect(badge).toHaveClass('bg-bg-tertiary');
  });

  it('calls onHover callback when mouse enters', () => {
    const mockOnHover = vi.fn();
    const { container } = render(
      <FlowPreviewCard flow={mockFlow} onHover={mockOnHover} />
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(card);

    expect(mockOnHover).toHaveBeenCalledOnce();
  });

  it('has correct accessibility attributes', () => {
    render(<FlowPreviewCard flow={mockFlow} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute(
      'aria-label',
      'Flow: Review Q4 planning document'
    );
  });

  it('shows full content in title attribute for tooltip', () => {
    const flowWithLongContent: Flow = {
      ...mockFlow,
      description:
        'This is the full description that should appear in the tooltip',
    };
    render(<FlowPreviewCard flow={flowWithLongContent} />);
    const article = screen.getByRole('article');
    const title = article.getAttribute('title');

    expect(title).toContain(flowWithLongContent.title);
    expect(title).toContain(flowWithLongContent.description);
  });

  it('applies custom className', () => {
    const { container } = render(
      <FlowPreviewCard flow={mockFlow} className="custom-class" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('has hover transition styles', () => {
    const { container } = render(<FlowPreviewCard flow={mockFlow} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hover:bg-card-hover');
    expect(card).toHaveClass('transition-colors');
    expect(card).toHaveClass('duration-fast');
  });
});
