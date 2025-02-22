import { describe, expect, it, vi } from 'vitest';

import type { LLMProvider, Message } from '../types';

describe('LLMProvider', () => {
  const mockMessages: Message[] = [
    { role: 'system', content: 'System message' },
    { role: 'user', content: 'User message' },
  ];

  const mockState = {
    key: 'value',
  };

  class TestProvider implements LLMProvider {
    async complete(messages: Message[], currentState?: Record<string, unknown>) {
      return {
        message: `Processed ${messages.length} messages with state: ${JSON.stringify(currentState)}`,
        action: 'test_action',
      };
    }
  }

  it('should process messages and state correctly', async () => {
    const provider = new TestProvider();
    const response = await provider.complete(mockMessages, mockState);

    expect(response).toEqual({
      message: 'Processed 2 messages with state: {"key":"value"}',
      action: 'test_action',
    });
  });

  it('should handle empty state', async () => {
    const provider = new TestProvider();
    const response = await provider.complete(mockMessages);

    expect(response).toEqual({
      message: 'Processed 2 messages with state: undefined',
      action: 'test_action',
    });
  });

  it('should handle empty message list', async () => {
    const provider = new TestProvider();
    const response = await provider.complete([], mockState);

    expect(response).toEqual({
      message: 'Processed 0 messages with state: {"key":"value"}',
      action: 'test_action',
    });
  });
});
