import { describe, expect, it, vi } from 'vitest';
import { render, screen } from './test-utils';
import { ChatBubble } from '../components/ChatBubble';

// Mock useReduxAI hook
vi.mock('../hooks/useReduxAI', () => ({
  useReduxAI: () => ({
    sendQuery: vi.fn(),
    isProcessing: false,
    error: null,
  }),
}));

describe('ChatBubble', () => {
  it('renders minimized state correctly', () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={true}
      />
    );

    expect(screen.getByRole('button')).toHaveClass('rounded-full');
  });

  it('renders chat interface when not minimized', () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask something...')).toBeInTheDocument();
  });

  it('shows input field in enabled state by default', () => {
    render(
      <ChatBubble
        className="test-class"
        onToggleActivityLog={() => {}}
        isMinimized={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask something...');
    expect(input).not.toBeDisabled();
  });
});