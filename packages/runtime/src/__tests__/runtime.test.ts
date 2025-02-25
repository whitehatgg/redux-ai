import { describe, expect, it, vi } from 'vitest';

import { Runtime } from '../index';
import type { CompletionResponse, LLMProvider, Message } from '../types';

class MockProvider implements LLMProvider {
  async complete(
    messages: Message[],
    currentState?: Record<string, unknown>
  ): Promise<CompletionResponse> {
    return {
      message: 'Test response',
      action: { type: 'test_action' },
    };
  }
}

describe('Runtime', () => {
  let provider: LLMProvider;
  let testMessages: Message[];

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MockProvider();
    testMessages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' },
    ];
  });

  describe('query', () => {
    it('should call provider.complete with correct parameters', async () => {
      const completeSpy = vi.spyOn(provider, 'complete');
      const runtime = new Runtime({ provider });
      const params = {
        query: 'test query',
        prompt: 'test prompt',
        currentState: { key: 'value' },
      };

      await runtime.query(params);

      expect(completeSpy).toHaveBeenCalled();
      const [messages, state] = completeSpy.mock.calls[0];
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ role: 'system', content: params.prompt });
      expect(messages[1]).toEqual({ role: 'user', content: params.query });
      expect(state).toEqual(params.currentState);
    });

    it('should return provider response', async () => {
      const runtime = new Runtime({ provider });
      const response = await runtime.query({
        query: 'test',
        prompt: 'test prompt',
      });

      expect(response).toEqual({
        message: 'Test response',
        action: { type: 'test_action' },
      });
    });

    it('should handle errors from provider', async () => {
      const errorProvider = {
        complete: vi.fn().mockRejectedValue(new Error('Provider error')),
      } as LLMProvider;

      const runtime = new Runtime({ provider: errorProvider });

      await expect(
        runtime.query({
          query: 'test',
          prompt: 'test prompt',
        })
      ).rejects.toThrow('Provider error');
    });
  });

  describe('debug mode', () => {
    it('should not affect query results', async () => {
      const runtime = new Runtime({ provider, debug: true });
      const response = await runtime.query({
        query: 'test',
        prompt: 'test prompt',
      });

      expect(response).toEqual({
        message: 'Test response',
        action: { type: 'test_action' },
      });
    });
  });
});