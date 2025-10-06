import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContextSwitcher } from '../context-switcher';
import type { Context } from '@/types/context';

expect.extend(toHaveNoViolations);

const mockContexts: Context[] = [
  {
    id: 'ctx-work-123',
    user_id: 'user-1',
    name: 'Work',
    color: '#3B82F6',
    icon: '💼',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-05T14:30:00Z',
  },
  {
    id: 'ctx-personal-456',
    user_id: 'user-1',
    name: 'Personal',
    color: '#F97316',
    icon: '🏠',
    created_at: '2025-10-01T10:05:00Z',
    updated_at: '2025-10-04T09:15:00Z',
  },
  {
    id: 'ctx-rest-789',
    user_id: 'user-1',
    name: 'Rest',
    color: '#8B5CF6',
    icon: '🌙',
    created_at: '2025-10-01T10:10:00Z',
    updated_at: '2025-10-03T18:00:00Z',
  },
  {
    id: 'ctx-social-012',
    user_id: 'user-1',
    name: 'Social',
    color: '#EC4899',
    icon: '🎉',
    created_at: '2025-10-01T10:15:00Z',
    updated_at: '2025-10-02T20:30:00Z',
  },
];

describe('ContextSwitcher', () => {
  it('renders correctly with contexts', () => {
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Should show current context in trigger
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
  });

  it('displays current context in trigger', () => {
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-personal-456"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Click trigger to open dropdown
    const trigger = screen.getByRole('button', { name: /select context/i });
    await user.click(trigger);

    // All contexts should be visible
    expect(screen.getAllByText('Work')).toHaveLength(2); // Trigger + dropdown
    expect(screen.getAllByText('Personal')).toHaveLength(1);
    expect(screen.getAllByText('Rest')).toHaveLength(1);
    expect(screen.getAllByText('Social')).toHaveLength(1);
  });

  it('calls onContextChange with correct ID when context is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /select context/i });
    await user.click(trigger);

    // Click on Personal context
    const personalOption = screen.getAllByText('Personal')[0];
    await user.click(personalOption);

    // Should call handler with correct ID
    expect(handleChange).toHaveBeenCalledWith('ctx-personal-456');
  });

  it('supports keyboard navigation with Arrow keys and Enter', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Focus trigger with Tab
    const trigger = screen.getByRole('button', { name: /select context/i });
    trigger.focus();

    // Open with Enter
    await user.keyboard('{Enter}');

    // Navigate down with ArrowDown (should move to second item since first is selected)
    await user.keyboard('{ArrowDown}');

    // Select with Enter
    await user.keyboard('{Enter}');

    // Should have called handler (second item in sorted list is Personal)
    expect(handleChange).toHaveBeenCalled();
  });

  it('has accessible labels and roles', () => {
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Should have accessible button role and label
    const trigger = screen.getByRole('button', { name: /select context/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-label', 'Select context');
  });

  it('marks current context with aria-current', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /select context/i });
    await user.click(trigger);

    // Find all context options
    const options = screen.getAllByRole('option');
    const workOption = options.find((opt) => opt.textContent?.includes('Work'));

    expect(workOption).toBeDefined();
    expect(workOption!).toHaveAttribute('aria-current', 'true');
  });

  it('sorts contexts by most recently used (updated_at descending)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /select context/i });
    await user.click(trigger);

    // Get all options
    const options = screen.getAllByRole('option');

    // Expected order: Work (10-05), Personal (10-04), Rest (10-03), Social (10-02)
    expect(options[0]?.textContent).toContain('Work');
    expect(options[1]?.textContent).toContain('Personal');
    expect(options[2]?.textContent).toContain('Rest');
    expect(options[3]?.textContent).toContain('Social');
  });

  it('has no accessibility violations', async () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies custom className to trigger', () => {
    const handleChange = vi.fn();
    render(
      <ContextSwitcher
        currentContextId="ctx-work-123"
        contexts={mockContexts}
        onContextChange={handleChange}
        className="custom-class"
      />
    );

    const trigger = screen.getByRole('button', { name: /select context/i });
    expect(trigger).toHaveClass('custom-class');
  });
});
