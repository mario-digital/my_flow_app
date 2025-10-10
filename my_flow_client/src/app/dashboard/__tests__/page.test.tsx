import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';
import DashboardPage from '../page';
import { AppProviders } from '@/components/providers/app-providers';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import type { CurrentUserState } from '@/hooks/use-current-user';
import type { Context } from '@/types/context';
import type { Flow } from '@/types/flow';
import { FlowPriority } from '@/types/enums';

// Mock the hooks
vi.mock('@/hooks/use-contexts');
vi.mock('@/hooks/use-flows');
vi.mock('@/components/chat/chat-interface', () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}));
vi.mock('@/components/flows/flow-list', () => ({
  FlowList: ({ flows }: { flows: Flow[] }) => (
    <div data-testid="flow-list">
      {flows.map((flow) => (
        <div key={flow.id} data-testid={`flow-${flow.id}`}>
          {flow.title}
        </div>
      ))}
    </div>
  ),
}));

const mockContexts: Context[] = [
  {
    id: 'context-1',
    user_id: 'user-1',
    name: 'Work',
    icon: '💼',
    color: '#6366f1',
    created_at: '2025-10-10T00:00:00Z',
    updated_at: '2025-10-10T00:00:00Z',
  },
  {
    id: 'context-2',
    user_id: 'user-1',
    name: 'Personal',
    icon: '🏠',
    color: '#f59e0b',
    created_at: '2025-10-10T00:00:00Z',
    updated_at: '2025-10-10T00:00:00Z',
  },
];

const mockFlows: Flow[] = [
  {
    id: 'flow-1',
    context_id: 'context-1',
    user_id: 'user-1',
    title: 'Review Q4 planning',
    description: 'Check budget allocations',
    priority: FlowPriority.High,
    is_completed: false,
    due_date: '2025-10-15T00:00:00Z',
    reminder_enabled: true,
    created_at: '2025-10-10T00:00:00Z',
    updated_at: '2025-10-10T00:00:00Z',
  },
  {
    id: 'flow-2',
    context_id: 'context-1',
    user_id: 'user-1',
    title: 'Prepare presentation',
    description: 'Slides for team meeting',
    priority: FlowPriority.Medium,
    is_completed: false,
    reminder_enabled: false,
    created_at: '2025-10-10T00:00:00Z',
    updated_at: '2025-10-10T00:00:00Z',
  },
];

const createWrapper = (userState: CurrentUserState) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <CurrentUserProvider value={userState}>
      <AppProviders>{children}</AppProviders>
    </CurrentUserProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard heading', async () => {
    const { useContexts } = await import('@/hooks/use-contexts');
    const { useFlows } = await import('@/hooks/use-flows');

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useContexts).mockReturnValue({
      data: mockContexts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useFlows).mockReturnValue({
      data: mockFlows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    const userState: CurrentUserState = {
      userId: 'user-1',
      email: 'test@example.com',
      isAuthenticated: true,
      isLoading: false,
      claims: null,
    };

    render(<DashboardPage />, { wrapper: createWrapper(userState) });

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeTruthy();
  });

  it('should show loading skeletons while data loads', async () => {
    const { useContexts } = await import('@/hooks/use-contexts');
    const { useFlows } = await import('@/hooks/use-flows');

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useContexts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isSuccess: false,
      isError: false,
    } as Partial<UseQueryResult>);

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useFlows).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isSuccess: false,
      isError: false,
    } as Partial<UseQueryResult>);

    const userState: CurrentUserState = {
      userId: 'user-1',
      email: 'test@example.com',
      isAuthenticated: true,
      isLoading: false,
      claims: null,
    };

    const { container } = render(<DashboardPage />, {
      wrapper: createWrapper(userState),
    });

    // Check for skeleton loaders (they have animate-pulse class)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when context has no flows', async () => {
    const { useContexts } = await import('@/hooks/use-contexts');
    const { useFlows } = await import('@/hooks/use-flows');

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useContexts).mockReturnValue({
      data: mockContexts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useFlows).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    const userState: CurrentUserState = {
      userId: 'user-1',
      email: 'test@example.com',
      isAuthenticated: true,
      isLoading: false,
      claims: null,
    };

    render(<DashboardPage />, { wrapper: createWrapper(userState) });

    await waitFor(() => {
      expect(screen.getByText(/no flows yet in this context/i)).toBeTruthy();
    });
  });

  it('should render FlowList when flows exist', async () => {
    const { useContexts } = await import('@/hooks/use-contexts');
    const { useFlows } = await import('@/hooks/use-flows');

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useContexts).mockReturnValue({
      data: mockContexts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useFlows).mockReturnValue({
      data: mockFlows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    const userState: CurrentUserState = {
      userId: 'user-1',
      email: 'test@example.com',
      isAuthenticated: true,
      isLoading: false,
      claims: null,
    };

    render(<DashboardPage />, { wrapper: createWrapper(userState) });

    await waitFor(() => {
      expect(screen.getByTestId('flow-list')).toBeTruthy();
      expect(screen.getByText('Review Q4 planning')).toBeTruthy();
      expect(screen.getByText('Prepare presentation')).toBeTruthy();
    });
  });

  it('should render ChatInterface when context is selected', async () => {
    const { useContexts } = await import('@/hooks/use-contexts');
    const { useFlows } = await import('@/hooks/use-flows');

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useContexts).mockReturnValue({
      data: mockContexts,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useFlows).mockReturnValue({
      data: mockFlows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: true,
      isError: false,
    } as Partial<UseQueryResult>);

    const userState: CurrentUserState = {
      userId: 'user-1',
      email: 'test@example.com',
      isAuthenticated: true,
      isLoading: false,
      claims: null,
    };

    render(<DashboardPage />, { wrapper: createWrapper(userState) });

    await waitFor(() => {
      expect(screen.getByTestId('chat-interface')).toBeTruthy();
    });
  });

  it('should show error message when contexts fail to load', async () => {
    const { useContexts } = await import('@/hooks/use-contexts');
    const { useFlows } = await import('@/hooks/use-flows');

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useContexts).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load contexts'),
      refetch: vi.fn(),
      isSuccess: false,
      isError: true,
    } as Partial<UseQueryResult>);

    // @ts-expect-error - Mocking partial UseQueryResult for test
    vi.mocked(useFlows).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isSuccess: false,
      isError: false,
    } as Partial<UseQueryResult>);

    const userState: CurrentUserState = {
      userId: 'user-1',
      email: 'test@example.com',
      isAuthenticated: true,
      isLoading: false,
      claims: null,
    };

    render(<DashboardPage />, { wrapper: createWrapper(userState) });

    expect(screen.getByText(/failed to load contexts/i)).toBeTruthy();
  });
});
