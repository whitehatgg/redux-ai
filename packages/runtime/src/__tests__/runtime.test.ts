import { describe, expect, it, vi } from 'vitest';

import type { CompletionResponse, LLMProvider, Message, Runtime } from '../types';

describe('Runtime', () => {
  const mockProvider: LLMProvider = {
    complete: vi.fn().mockImplementation(async () => ({
      message: 'Test response',
      action: 'test_action',
    })),
  };

  const testMessages: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello' },
  ];

  const createTestRuntime = (debug = false): Runtime => ({
    provider: mockProvider,
    messages: testMessages,
    currentState: {},
    debug,
    query: async params => {
      const response = await mockProvider.complete(testMessages, params.currentState);
      return response;
    },
  });

  describe('query', () => {
    it('should call provider.complete with correct parameters', async () => {
      const runtime = createTestRuntime();
      const params = {
        query: 'test query',
        prompt: 'test prompt',
        currentState: { key: 'value' },
      };

      await runtime.query(params);
      expect(mockProvider.complete).toHaveBeenCalledWith(testMessages, params.currentState);
    });

    it('should return provider response', async () => {
      const runtime = createTestRuntime();
      const expectedResponse: CompletionResponse = {
        message: 'Test response',
        action: 'test_action',
      };

      const response = await runtime.query({ query: 'test' });
      expect(response).toEqual(expectedResponse);
    });

    it('should handle errors from provider', async () => {
      const errorProvider: LLMProvider = {
        complete: vi.fn().mockRejectedValue(new Error('Provider error')),
      };

      const runtime: Runtime = {
        provider: errorProvider,
        messages: testMessages,
        debug: false,
        query: async params => {
          // Directly throw the error without unnecessary try/catch
          return await errorProvider.complete(testMessages, params.currentState);
        },
      };

      await expect(runtime.query({ query: 'test' })).rejects.toThrow('Provider error');
    });
  });

  describe('debug mode', () => {
    it('should not affect query results', async () => {
      const runtime = createTestRuntime(true);
      const response = await runtime.query({ query: 'test' });
      expect(response).toEqual({
        message: 'Test response',
        action: 'test_action',
      });
    });
  });
});
