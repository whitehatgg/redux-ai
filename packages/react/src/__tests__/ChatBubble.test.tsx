import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitForStateUpdates, mockUseReduxAI } from './test-utils';
import userEvent from '@testing-library/user-event';
import { ChatBubble } from '../components/ChatBubble';

describe('ChatBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders minimized state correctly', async () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={true}
      />
    );

    await waitForStateUpdates();
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('rounded-full');
  });

  it('renders chat interface when not minimized', async () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    await waitForStateUpdates();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Ask something...');
    expect(input).toBeInTheDocument();
  });

  it('handles message submission', async () => {
    const user = userEvent.setup();
    const mockSendQuery = vi.fn().mockResolvedValue('Test response');
    mockUseReduxAI.mockReturnValue({
      sendQuery: mockSendQuery,
      isProcessing: false,
      error: null,
    });

    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    await waitForStateUpdates();
    const input = screen.getByPlaceholderText('Ask something...');
    const submitButton = screen.getByText('Send');

    await user.type(input, 'Test message');
    await user.click(submitButton);

    expect(mockSendQuery).toHaveBeenCalledWith('Test message');
  });
});