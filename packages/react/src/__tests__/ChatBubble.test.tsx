import { describe, expect, it, vi } from 'vitest';
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

    (useReduxAI as jest.Mock).mockReturnValue({
      sendQuery: mockSendQuery,
      isProcessing: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders minimized state correctly', async () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={true}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('rounded-full');
    });
  });

  it('renders chat interface when not minimized', async () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Ask something...');
      expect(input).toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask something...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Ask something...');
    const submitButton = screen.getByText('Send');

    await user.type(input, 'Test message');
    await user.click(submitButton);

    expect(mockSendQuery).toHaveBeenCalledWith('Test message');
  });
});