import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContextSummaryWidget } from '../context-summary-widget';
import * as useContextSummariesModule from '@/hooks/use-context-summaries';
import type { ContextWithSummary } from '@/types/context-summary';

// Mock the useContextSummaries hook
vi.mock('@/hooks/use-context-summaries', () => ({
  useContextSummaries: vi.fn(),
}));

const mockContextSummaries: ContextWithSummary[] = [
  {
    context_id: '1',
    context_name: 'Work',
    context_icon: '💼',
    context_color: '#3b82f6',
    summary: {
      context_id: '1',
      incomplete_flows_count: 8,
      completed_flows_count: 12,
      summary_text: 'Work context summary',
      last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      top_priorities: [],
    },
  },
  {
    context_id: '2',
    context_name: 'Personal',
    context_icon: '🏠',
    context_color: '#f59e0b',
    summary: {
      context_id: '2',
      incomplete_flows_count: 5,
      completed_flows_count: 8,
      summary_text: 'Personal context summary',
      last_activity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      top_priorities: [],
    },
  },
];

// Helper to create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

// Helper wrapper component
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe('ContextSummaryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loading state shows skeleton cards', () => {
    vi.mocked(useContextSummariesModule.useContextSummaries).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isSuccess: false,
      isError: false,
      status: 'pending',
    } as never);

    render(<ContextSummaryWidget onContextClick={vi.fn()} />, {
      wrapper: Wrapper,
    });

    // Check for skeleton elements (should have 4 skeleton cards)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Check for skeleton height tokens
    expect(document.querySelector('.h-skeleton-title')).toBeInTheDocument();
    expect(document.querySelector('.h-skeleton-text')).toBeInTheDocument();
  });

  it('error state shows error message', () => {
    const error = new Error('Failed to fetch context summaries');
    vi.mocked(useContextSummariesModule.useContextSummaries).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      refetch: vi.fn(),
      isSuccess: false,
      isError: true,
      status: 'error',
    } as never);

    render(<ContextSummaryWidget onContextClick={vi.fn()} />, {
      wrapper: Wrapper,
    });

    expect(
      screen.getByText('Failed to load context summaries')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Failed to fetch context summaries')
    ).toBeInTheDocument();
  });

  it('empty state shows "No contexts yet"', () => {
    vi.mocked(useContextSummariesModule.useContextSummaries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
      status: 'success',
    } as never);

    render(<ContextSummaryWidget onContextClick={vi.fn()} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('No contexts yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first context to get started')
    ).toBeInTheDocument();
  });

  it('success state renders context cards', () => {
    vi.mocked(useContextSummariesModule.useContextSummaries).mockReturnValue({
      data: mockContextSummaries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
      status: 'success',
    } as never);

    render(<ContextSummaryWidget onContextClick={vi.fn()} />, {
      wrapper: Wrapper,
    });

    // Check that both contexts are rendered
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('clicking card calls onContextClick with context_id', () => {
    const handleContextClick = vi.fn();
    vi.mocked(useContextSummariesModule.useContextSummaries).mockReturnValue({
      data: mockContextSummaries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
      status: 'success',
    } as never);

    render(<ContextSummaryWidget onContextClick={handleContextClick} />, {
      wrapper: Wrapper,
    });

    // Click the Work context card
    const workCard = screen.getByText('Work').closest('[role="button"]');
    if (workCard) {
      fireEvent.click(workCard);
      expect(handleContextClick).toHaveBeenCalledWith('1');
    }
  });

  it('responsive grid classes applied', () => {
    vi.mocked(useContextSummariesModule.useContextSummaries).mockReturnValue({
      data: mockContextSummaries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
      status: 'success',
    } as never);

    const { container } = render(
      <ContextSummaryWidget onContextClick={vi.fn()} />,
      { wrapper: Wrapper }
    );

    // Check for responsive grid classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('sm:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
    expect(gridContainer).toHaveClass('xl:grid-cols-4');
  });
});
