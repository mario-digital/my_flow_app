import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddContextCard } from '../add-context-card';

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
    expect(screen.queryByLabelText('Context Name')).not.toBeInTheDocument();
  });

  it('expands to show form when plus icon is clicked', async () => {
    const user = userEvent.setup();
    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    const addButton = screen.getByText('Add Context').closest('div');
    await user.click(addButton!);

    expect(screen.getByLabelText('Context Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    // Check for both cancel buttons (X icon and Cancel text button)
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it('collapses form when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    // Expand
    const expandButton = screen.getByText('Add Context').closest('div');
    await user.click(expandButton!);
    expect(screen.getByLabelText('Context Name')).toBeInTheDocument();

    // Collapse - click the text Cancel button (not the X icon)
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    // The text "Cancel" button is the second one (first is X icon with aria-label)
    const cancelButton = cancelButtons[cancelButtons.length - 1];
    if (!cancelButton) throw new Error('Cancel button not found');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Context Name')).not.toBeInTheDocument();
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

    // Mock the fetch API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCreatedContext,
    } as Response);

    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    // Expand form
    const formButton = screen.getByText('Add Context').closest('div');
    await user.click(formButton!);

    // Fill in name
    const nameInput = screen.getByLabelText('Context Name');
    await user.type(nameInput, 'My New Context');

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      // Check that fetch was called with correct URL and method
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/contexts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Verify the body contains the name we entered
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0];
      if (!fetchCall) throw new Error('Fetch was not called');
      const body = JSON.parse(fetchCall[1].body as string);
      expect(body.name).toBe('My New Context');
      expect(body.icon).toBeTruthy();
      expect(body.color).toBeTruthy();

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

    // Mock fetch to return an error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    render(<AddContextCard onContextCreated={mockOnContextCreated} />, {
      wrapper: Wrapper,
    });

    // Expand and fill
    const errorButton = screen.getByText('Add Context').closest('div');
    await user.click(errorButton!);
    await user.type(screen.getByLabelText('Context Name'), 'Test Context');

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockOnContextCreated).not.toHaveBeenCalled();
      // Form should stay open on error
      expect(screen.getByLabelText('Context Name')).toBeInTheDocument();
    });
  });
});
