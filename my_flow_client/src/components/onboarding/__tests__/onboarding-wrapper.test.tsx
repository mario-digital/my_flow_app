import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingWrapper } from '../onboarding-wrapper';

// Mock dependencies
vi.mock('@/hooks/use-onboarding', () => ({
  useOnboarding: vi.fn(() => ({
    isOpen: false,
    handleClose: vi.fn(),
    handleComplete: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(() => ({
    userId: 'test-user',
    email: 'test@example.com',
    isAuthenticated: true,
    isLoading: false,
  })),
}));

vi.mock('../onboarding-modal', () => ({
  OnboardingModal: vi.fn(() => <div data-testid="onboarding-modal" />),
}));

import { useOnboarding } from '@/hooks/use-onboarding';
import { OnboardingModal } from '../onboarding-modal';

describe('OnboardingWrapper', () => {
  it('renders OnboardingModal when isOpen is true', () => {
    vi.mocked(useOnboarding).mockReturnValue({
      isOpen: true,
      handleClose: vi.fn(),
      handleComplete: vi.fn(),
      triggerManually: vi.fn(),
    });

    render(<OnboardingWrapper />);

    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    expect(OnboardingModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
      undefined
    );
  });

  it('renders OnboardingModal when isOpen is false', () => {
    vi.mocked(useOnboarding).mockReturnValue({
      isOpen: false,
      handleClose: vi.fn(),
      handleComplete: vi.fn(),
      triggerManually: vi.fn(),
    });

    render(<OnboardingWrapper />);

    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    expect(OnboardingModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: false,
      }),
      undefined
    );
  });

  it('passes handleClose and handleComplete to OnboardingModal', () => {
    const mockHandleClose = vi.fn();
    const mockHandleComplete = vi.fn();

    vi.mocked(useOnboarding).mockReturnValue({
      isOpen: true,
      handleClose: mockHandleClose,
      handleComplete: mockHandleComplete,
      triggerManually: vi.fn(),
    });

    render(<OnboardingWrapper />);

    expect(OnboardingModal).toHaveBeenCalledWith(
      expect.objectContaining({
        onClose: mockHandleClose,
        onComplete: mockHandleComplete,
      }),
      undefined
    );
  });
});
