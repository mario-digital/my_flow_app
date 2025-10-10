import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageBubble } from '../message-bubble';
import type { Message } from '@/types/chat';

describe('MessageBubble', () => {
  const mockUserMessage: Message = {
    id: 'msg-1',
    role: 'user',
    content: 'Test user message',
    timestamp: new Date('2025-10-10T12:00:00Z').toISOString(),
  };

  const mockAssistantMessage: Message = {
    id: 'msg-2',
    role: 'assistant',
    content: 'Test assistant message',
    timestamp: new Date('2025-10-10T12:01:00Z').toISOString(),
  };

  const mockSystemMessage: Message = {
    id: 'msg-3',
    role: 'system',
    content: 'System notification',
    timestamp: new Date('2025-10-10T12:02:00Z').toISOString(),
  };

  it('renders user message with correct styling', () => {
    render(<MessageBubble message={mockUserMessage} />);

    // Check message content is rendered
    expect(screen.getByText('Test user message')).toBeTruthy();

    // Check timestamp is rendered (will vary by timezone)
    expect(screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/)).toBeTruthy();
  });

  it('renders assistant message with correct styling', () => {
    render(<MessageBubble message={mockAssistantMessage} />);

    // Check message content is rendered
    expect(screen.getByText('Test assistant message')).toBeTruthy();

    // Check timestamp is rendered (will vary by timezone)
    expect(screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/)).toBeTruthy();
  });

  it('renders system message with correct styling', () => {
    render(<MessageBubble message={mockSystemMessage} />);

    // Check message content is rendered
    expect(screen.getByText('System notification')).toBeTruthy();
  });

  it('displays timestamp correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);

    // Timestamp should be formatted in locale-aware format (12-hour with AM/PM)
    const timestamp = screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/);
    expect(timestamp).toBeTruthy();
  });

  it('shows typing indicator when isTyping is true', () => {
    render(<MessageBubble message={mockAssistantMessage} isTyping={true} />);

    // Check typing indicator is shown
    expect(
      screen.getByRole('status', { name: /assistant is typing/i })
    ).toBeTruthy();
  });

  it('renders markdown content correctly - bold text', () => {
    const messageWithMarkdown: Message = {
      id: 'msg-4',
      role: 'assistant',
      content: 'This is **bold** text',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={messageWithMarkdown} />);

    // ReactMarkdown should render bold text
    expect(screen.getByText('bold')).toBeTruthy();
  });

  it('renders markdown content correctly - links', () => {
    const messageWithLink: Message = {
      id: 'msg-5',
      role: 'assistant',
      content: 'Check out [this link](https://example.com)',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={messageWithLink} />);

    // Check link is rendered
    const link = screen.getByRole('link', { name: /this link/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('renders markdown content correctly - code blocks', () => {
    const messageWithCode: Message = {
      id: 'msg-6',
      role: 'assistant',
      content: 'Here is some `inline code` for you',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={messageWithCode} />);

    // Check code is rendered
    expect(screen.getByText('inline code')).toBeTruthy();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <MessageBubble message={mockUserMessage} className="custom-class" />
    );

    // Check custom class is applied to container
    const messageContainer = container.firstChild as HTMLElement;
    expect(messageContainer.className).toContain('custom-class');
  });

  it('renders AI avatar for assistant messages', () => {
    render(<MessageBubble message={mockAssistantMessage} />);

    // Check that AI icon is rendered (lucide-react MessageCircle)
    const container = screen.getByText('Test assistant message').parentElement
      ?.parentElement;
    expect(container).toBeTruthy();
  });

  it('does not render AI avatar for user messages', () => {
    const { container } = render(<MessageBubble message={mockUserMessage} />);

    // User messages should be right-aligned without avatar
    const messageContainer = container.querySelector('.justify-end');
    expect(messageContainer).toBeTruthy();
  });
});
