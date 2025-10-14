import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddContextCard } from '../add-context-card';
import * as apiClient from '@/lib/api/contexts';

vi.mock('@/lib/api/contexts');

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AddContextCard', () => {
  const mockOnContextCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collapsed state with plus icon', () => {
    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('Add Context')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Context name')
    ).not.toBeInTheDocument();
  });

  it('expands to show form when plus icon is clicked', async () => {
    const user = userEvent.setup();
    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    const addButton = screen.getByText('Add Context').closest('div');
    await user.click(addButton!);

    expect(screen.getByPlaceholderText('Context name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('collapses form when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    // Expand
    const expandButton = screen.getByText('Add Context').closest('div');
    await user.click(expandButton!);
    expect(screen.getByPlaceholderText('Context name')).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('Context name')
      ).not.toBeInTheDocument();
    });
  });

  it('creates context with user inputs', async () => {
    const user = userEvent.setup();
    const mockCreatedContext = {
      id: 'new-ctx-1',
      user_id: 'user-1',
      name: 'My New Context',
      icon: '📚',
      color: '#3b82f6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(apiClient.createContext).mockResolvedValue(mockCreatedContext);

    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    // Expand form
    const formButton = screen.getByText('Add Context').closest('div');
    await user.click(formButton!);

    // Fill in name
    const nameInput = screen.getByPlaceholderText('Context name');
    await user.type(nameInput, 'My New Context');

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(apiClient.createContext).toHaveBeenCalledWith({
        name: 'My New Context',
        icon: expect.any(String),
        color: expect.any(String),
      });
      expect(mockOnContextCreated).toHaveBeenCalledWith('new-ctx-1');
    });
  });

  it('disables create button when name is empty', async () => {
    const user = userEvent.setup();
    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    const disabledButton = screen.getByText('Add Context').closest('div');
    await user.click(disabledButton!);

    const createButton = screen.getByRole('button', { name: /create/i });
    expect(createButton).toBeDisabled();
  });

  it('shows error toast when context creation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.createContext).mockRejectedValue(
      new Error('Failed to create')
    );

    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    // Expand and fill
    const errorButton = screen.getByText('Add Context').closest('div');
    await user.click(errorButton!);
    await user.type(
      screen.getByPlaceholderText('Context name'),
      'Test Context'
    );

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockOnContextCreated).not.toHaveBeenCalled();
      // Form should stay open on error
      expect(screen.getByPlaceholderText('Context name')).toBeInTheDocument();
    });
  });
});
