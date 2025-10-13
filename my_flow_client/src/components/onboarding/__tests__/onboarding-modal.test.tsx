import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingModal } from '../onboarding-modal';

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('OnboardingModal', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.mocked(global.fetch).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows Step 1 (Welcome) initially', () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Welcome to My Flow' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Organize your life with contexts/i).length
    ).toBeGreaterThan(0);
  });

  it('"Next" button advances to Step 2', async () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Click Next button
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Create Your First Context',
        })
      ).toBeInTheDocument();
    });
  });

  it('"Back" button returns to previous step', async () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Go to step 2
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Create Your First Context',
        })
      ).toBeInTheDocument();
    });

    // Click Back button
    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Welcome to My Flow',
        })
      ).toBeInTheDocument();
    });
  });

  it('"Skip" button closes modal and sets localStorage', () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const skipButton = screen.getByRole('button', { name: 'Skip' });
    fireEvent.click(skipButton);

    expect(localStorage.getItem('has_seen_onboarding')).toBe('true');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('Step 2 requires context name to proceed', async () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Go to step 2
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Create Your First Context',
        })
      ).toBeInTheDocument();
    });

    // Clear the default context name
    const input = screen.getByPlaceholderText(/e.g., Work, Personal/i);
    fireEvent.change(input, { target: { value: '' } });

    // Next button should be disabled
    const getStartedButton = screen.getByRole('button', {
      name: 'Get Started',
    });
    expect(getStartedButton).toBeDisabled();
  });

  it('"Create Sample Data" calls API and completes', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Create Your First Context',
        })
      ).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: 'Get Started',
    });
    fireEvent.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    // Click Create Sample Data
    const sampleDataButton = screen.getByText('Create Sample Data');
    fireEvent.click(sampleDataButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/onboarding/sample-data',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem('has_seen_onboarding')).toBe('true');
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('"Start Fresh" creates single context and completes', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '123',
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
      }),
    } as Response);

    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Create Your First Context',
        })
      ).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: 'Get Started',
    });
    fireEvent.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    // Click Start Fresh
    const startFreshButton = screen.getByText('Start Fresh');
    fireEvent.click(startFreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/contexts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: expect.stringContaining('Work'),
        })
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem('has_seen_onboarding')).toBe('true');
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('progress indicator shows correct step', async () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Check step 1 indicator
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    // Go to step 2
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });
  });

  it('loading state shows during sample data creation', async () => {
    // Mock slow API response
    vi.mocked(global.fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              } as Response),
            100
          )
        )
    );

    render(
      <OnboardingModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Create Your First Context',
        })
      ).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: 'Get Started',
    });
    fireEvent.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    // Click Create Sample Data
    const sampleDataButton = screen.getByText('Create Sample Data');
    fireEvent.click(sampleDataButton);

    // Should show loading state
    await waitFor(() => {
      expect(
        screen.getByText('Creating your sample data...')
      ).toBeInTheDocument();
    });
  });
});
