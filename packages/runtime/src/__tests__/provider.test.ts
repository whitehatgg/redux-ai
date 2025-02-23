import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompletionResponse, LLMProvider, Message } from '../types';

class MockProvider implements LLMProvider {
  private mockComplete = vi.fn().mockImplementation(
    async (
      messages: Message[],
      currentState?: Record<string, unknown>
    ): Promise<CompletionResponse> => ({
      message: `Processed ${messages.length} messages with state: ${JSON.stringify(currentState)}`,
      action: { type: 'test_action' },
    })
  );

  async complete(
    messages: Message[],
    currentState?: Record<string, unknown>
  ): Promise<CompletionResponse> {
    return this.mockComplete(messages, currentState);
  }
}

describe('LLMProvider', () => {
  let provider: LLMProvider;
  const mockMessages: Message[] = [
    { role: 'system', content: 'System message' },
    { role: 'user', content: 'User message' },
  ];

  const mockState = {
    key: 'value',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MockProvider();
  });

  it('should process messages and state correctly', async () => {
    const response = await provider.complete(mockMessages, mockState);

    expect(response).toEqual({
      message: `Processed ${mockMessages.length} messages with state: ${JSON.stringify(mockState)}`,
      action: { type: 'test_action' },
    });
  });

  it('should handle empty state', async () => {
    const response = await provider.complete(mockMessages);

    expect(response).toEqual({
      message: `Processed ${mockMessages.length} messages with state: undefined`,
      action: { type: 'test_action' },
    });
  });

  it('should handle empty message list', async () => {
    const response = await provider.complete([], mockState);

    expect(response).toEqual({
      message: `Processed 0 messages with state: ${JSON.stringify(mockState)}`,
      action: { type: 'test_action' },
    });
  });
});
