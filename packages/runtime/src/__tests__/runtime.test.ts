import { describe, expect, it } from 'vitest';
import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import type { CompletionResponse, IntentCompletionResponse, Message } from '../types';

class MockProvider extends BaseLLMProvider {
  protected convertMessage(message: Message): unknown {
    return message;
  }

  protected async completeRaw(messages: Message[]): Promise<CompletionResponse | IntentCompletionResponse> {
    const systemPrompt = messages[0].content;
    const userQuery = messages[1]?.content || '';

    // Handle intent classification
    if (systemPrompt.includes('INTENT CLASSIFICATION RULES')) {
      const hasState = systemPrompt.includes('Current state:');
      const hasActions = systemPrompt.includes('Available actions:');
      const isStateQuery = userQuery.toLowerCase().includes('state');
      const intent = isStateQuery ? 'state' : hasActions ? 'action' : 'conversation';

      return {
        intent,
        message: `Classified as ${intent} query`,
        reasoning: ['Query analysis complete'],
      };
    }

    // Default response
    return {
      message: 'Mock response',
      action: null,
      reasoning: ['Test reasoning'],
      intent: 'conversation',
    };
  }
}

describe('Runtime Dynamic Prompt Tests', () => {
  const mockProvider = new MockProvider();

  describe('Intent Classification', () => {
    it('should properly classify state query with state context', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'show the state',
        state: { test: true },
      });

      expect(result.intent).toBe('state');
    });

    it('should classify as action when actions available', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'perform action',
        actions: { test_action: { params: [] } },
      });

      expect(result.intent).toBe('action');
    });

    it('should default to conversation without specific context', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'hello there',
      });

      expect(result.intent).toBe('conversation');
    });
  });
});