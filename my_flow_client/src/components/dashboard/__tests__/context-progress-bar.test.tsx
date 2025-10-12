import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContextProgressBar } from '../context-progress-bar';

describe('ContextProgressBar', () => {
  it('renders completed count correctly', () => {
    render(
      <ContextProgressBar completed={5} incomplete={5} contextColor="#3b82f6" />
    );

    expect(screen.getByText('5 of 10 completed')).toBeInTheDocument();
  });

  it('renders percentage correctly (50% for 5 completed, 5 incomplete)', () => {
    render(
      <ContextProgressBar completed={5} incomplete={5} contextColor="#3b82f6" />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders 0% for no flows', () => {
    render(
      <ContextProgressBar completed={0} incomplete={0} contextColor="#3b82f6" />
    );

    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders 100% for all completed flows', () => {
    render(
      <ContextProgressBar
        completed={10}
        incomplete={0}
        contextColor="#3b82f6"
      />
    );

    expect(screen.getByText('10 of 10 completed')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('uses dynamic context color via style prop', () => {
    const { container } = render(
      <ContextProgressBar completed={5} incomplete={5} contextColor="#ff0000" />
    );

    // Check that the progress bar fill has the correct color
    const progressFill = container.querySelector('.h-full');
    expect(progressFill).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});
