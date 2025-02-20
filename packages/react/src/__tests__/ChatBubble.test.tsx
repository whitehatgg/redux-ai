import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatBubble } from '../components/ChatBubble';
import { useReduxAI } from '../hooks/useReduxAI';

// Mock the useReduxAI hook
vi.mock('../hooks/useReduxAI', () => ({
  useReduxAI: vi.fn(),
}));

describe('ChatBubble', () => {
  const mockSendQuery = vi.fn().mockResolvedValue('Test response');

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    (useReduxAI as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sendQuery: mockSendQuery,
      isProcessing: false,
      error: null,
    });
  });

  it('renders minimized state correctly', () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.className).toContain('rounded-full');
  });

  it('renders chat interface when not minimized', () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    expect(screen.getByText('AI Assistant')).toBeDefined();
    const input = screen.getByPlaceholderText('Ask something...');
    expect(input).toBeDefined();
  });

  it('handles message submission', async () => {
    const user = userEvent.setup();

    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask something...') as HTMLInputElement;
    const submitButton = screen.getByText('Send');

    await user.type(input, 'Test message');
    await user.click(submitButton);

    expect(mockSendQuery).toHaveBeenCalledWith('Test message');
  });
});