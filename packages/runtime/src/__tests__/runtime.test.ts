import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import type { CompletionResponse, IntentCompletionResponse, Message } from '../types';

class MockProvider extends BaseLLMProvider {
  responses: Array<CompletionResponse | IntentCompletionResponse>;

  constructor(responses: Array<CompletionResponse | IntentCompletionResponse>) {
    super({ timeout: 30000, debug: false });
    this.responses = responses;
  }

  async complete(_prompt: string): Promise<CompletionResponse | IntentCompletionResponse> {
    const response = this.responses.shift();
    if (!response) {
      throw new Error('No more mock responses');
    }
    return response;
  }

  protected async completeRaw(): Promise<unknown> {
    return {};
  }

  protected convertMessage(_message: Message): unknown {
    return {};
  }
}

describe('Runtime Core Functionality', () => {
  describe('Intent Classification', () => {
    it('should handle action intent with proper resources', async () => {
      const provider = new MockProvider([
        { intent: 'action' as const, message: 'Action detected' },
        { message: 'Action executed', action: { type: 'test', payload: {} } },
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'execute action',
        actions: { test: {} },
      });

      expect(result).toEqual({
        message: 'Action executed',
        action: { type: 'test', payload: {} },
      });
    });

    it('should handle state queries with available state', async () => {
      const provider = new MockProvider([
        { intent: 'state' as const, message: 'State detected' },
        { message: 'Current state info', action: null },
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'get state',
        state: { test: true },
      });

      expect(result).toEqual({
        message: 'Current state info',
        action: null,
      });
    });

    it('should handle conversation queries', async () => {
      const provider = new MockProvider([
        { intent: 'conversation' as const, message: 'Chat detected' },
        { message: 'Chat response', action: null },
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'hello',
      });

      expect(result).toEqual({
        message: 'Chat response',
        action: null,
      });
    });
  });

  describe('Resource Validation', () => {
    it('should throw error for action intent when actions unavailable', async () => {
      const provider = new MockProvider([
        { intent: 'action' as const, message: 'Action detected' },
      ]);

      const runtime = createRuntime({ provider });
      await expect(
        runtime.query({
          query: 'execute action',
        })
      ).rejects.toThrow('No actions available for action intent');
    });

    it('should throw error for state intent when state unavailable', async () => {
      const provider = new MockProvider([{ intent: 'state' as const, message: 'State detected' }]);

      const runtime = createRuntime({ provider });
      await expect(
        runtime.query({
          query: 'get state',
        })
      ).rejects.toThrow('No state available for state intent');
    });
  });

  describe('Error Handling', () => {
    it('should propagate provider errors', async () => {
      const errorProvider = new MockProvider([]);
      vi.spyOn(errorProvider, 'complete').mockRejectedValue(new Error('Provider error'));

      const runtime = createRuntime({ provider: errorProvider });
      await expect(
        runtime.query({
          query: 'test',
        })
      ).rejects.toThrow('Provider error');
    });
  });
});
