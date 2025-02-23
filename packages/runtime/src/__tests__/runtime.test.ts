import { describe, expect, it, vi } from 'vitest';

import type { CompletionResponse, LLMProvider, Message } from '../types';
import { Runtime } from '../index';

/**
 * Test suite for Runtime
 * 
 * Following consistent mocking patterns:
 * 1. Use class-based mocks for better type safety
 * 2. Maintain proper typing for mock implementations
 * 3. Keep mocks simple and focused
 */

class MockProvider implements LLMProvider {
  complete: ReturnType<typeof vi.fn>;

  constructor() {
    this.complete = vi.fn().mockImplementation(async () => ({
      message: 'Test response',
      action: 'test_action',
    }));
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
      const runtime = new Runtime({ provider });
      const params = {
        query: 'test query',
        prompt: 'test prompt',
        actions: ['test_action'],
        currentState: { key: 'value' },
      };

      await runtime.query(params);

      expect(provider.complete).toHaveBeenCalled();
      const [messages, state] = provider.complete.mock.calls[0];
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ role: 'system', content: params.prompt });
      expect(messages[1]).toEqual({ role: 'user', content: params.query });
      expect(state).toEqual(params.currentState);
    });

    it('should return provider response', async () => {
      const runtime = new Runtime({ provider });
      const expectedResponse: CompletionResponse = {
        message: 'Test response',
        action: 'test_action',
      };

      const response = await runtime.query({
        query: 'test',
        prompt: 'test prompt',
        actions: ['test_action'],
      });

      expect(response).toEqual(expectedResponse);
    });

    it('should handle errors from provider', async () => {
      const errorProvider = new MockProvider();
      errorProvider.complete = vi.fn().mockRejectedValue(new Error('Provider error'));

      const runtime = new Runtime({ provider: errorProvider });

      await expect(
        runtime.query({
          query: 'test',
          prompt: 'test prompt',
          actions: ['test_action'],
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
        actions: ['test_action'],
      });

      expect(response).toEqual({
        message: 'Test response',
        action: 'test_action',
      });
    });
  });
});