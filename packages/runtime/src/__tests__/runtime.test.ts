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
  describe('Intent Processing', () => {
    it('should handle action intent with proper resources', async () => {
      const provider = new MockProvider([
        { intent: 'action' as const, message: 'Action detected' },
        { message: 'Action executed', action: { type: 'test' }, intent: 'action' },
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'execute action',
        actions: { test: {} },
      });

      expect(result).toEqual({
        message: 'Action executed',
        action: { type: 'test' },
        intent: 'action',
      });
    });

    it('should handle state intent with available state', async () => {
      const provider = new MockProvider([
        { intent: 'state' as const, message: 'State query' },
        { message: 'Current state', action: null, intent: 'state' },
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'get state',
        state: { test: true },
      });

      expect(result).toEqual({
        message: 'Current state',
        action: null,
        intent: 'state',
      });
    });

    it('should handle conversation intent', async () => {
      const provider = new MockProvider([
        { intent: 'conversation' as const, message: 'Chat mode' },
        { message: 'Chat response', action: null, intent: 'conversation' },
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({ query: 'hello' });

      expect(result).toEqual({
        message: 'Chat response',
        action: null,
        intent: 'conversation',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors', async () => {
      const errorProvider = new MockProvider([]);
      vi.spyOn(errorProvider, 'complete').mockRejectedValue(new Error('Provider error'));

      const runtime = createRuntime({ provider: errorProvider });
      await expect(runtime.query({ query: 'test' })).rejects.toThrow('Provider error');
    });

    it('should handle missing resources gracefully', async () => {
      const provider = new MockProvider([
        { intent: 'action' as const, message: 'Action detected' },
      ]);

      const runtime = createRuntime({ provider });
      await expect(runtime.query({ query: 'test' })).rejects.toThrow('No actions available');
    });
  });
});