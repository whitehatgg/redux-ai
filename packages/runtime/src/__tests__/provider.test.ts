import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompletionResponse, Message } from '../types';
import { BaseLLMProvider } from '../provider';

class MockProvider extends BaseLLMProvider {
  protected convertMessage(message: Message): unknown {
    return message;
  }

  protected async completeRaw(messages: Message[]): Promise<CompletionResponse> {
    return {
      message: `Processed ${messages.length} messages`,
      action: { type: 'test_action' },
      reasoning: ['Test reasoning']
    };
  }
}

describe('LLMProvider', () => {
  let provider: BaseLLMProvider;
  const mockMessages: Message[] = [
    { role: 'system', content: 'System message' },
    { role: 'user', content: 'User message' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MockProvider();
  });

  it('should process messages correctly', async () => {
    const response = await provider.createCompletion(mockMessages);

    expect(response).toEqual({
      message: 'Processed 2 messages',
      action: { type: 'test_action' },
      reasoning: ['Test reasoning']
    });
  });

  it('should handle empty message list', async () => {
    const response = await provider.createCompletion([]);

    expect(response).toEqual({
      message: 'Processed 0 messages',
      action: { type: 'test_action' },
      reasoning: ['Test reasoning']
    });
  });
});