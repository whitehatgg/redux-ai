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
    const userQuery = messages[1]?.content.toLowerCase() || '';

    // Handle intent classification
    if (systemPrompt.includes('INTENT CLASSIFICATION RULES')) {
      if (userQuery.includes('action')) {
        return {
          intent: 'action',
          message: 'Classified as action query',
          reasoning: ['Query analysis complete'],
        };
      } else if (userQuery.includes('state')) {
        return {
          intent: 'state',
          message: 'Classified as state query',
          reasoning: ['Query analysis complete'],
        };
      }
      return {
        intent: 'conversation',
        message: 'Classified as conversation query',
        reasoning: ['Query analysis complete'],
      };
    }

    // Handle action/state/conversation processing
    if (userQuery.includes('action') && !systemPrompt.includes('Available actions:')) {
      return {
        message: 'Defaulting to conversation - no actions schema available',
        action: null,
        reasoning: ['Action intent requires actions schema'],
      };
    } else if (userQuery.includes('state') && !systemPrompt.includes('Current state:')) {
      return {
        message: 'Defaulting to conversation - no state data available',
        action: null,
        reasoning: ['State intent requires state data'],
      };
    }

    // Default conversation response
    return {
      message: 'Conversation response',
      action: null,
      reasoning: ['Test reasoning'],
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

    it('should force conversation intent when action requested but no actions schema', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'perform action',
        state: { test: true }, // Only state provided, no actions
      });

      expect(result.intent).toBe('conversation');
      expect(result.message).toBe('Defaulting to conversation - no actions schema available');
      expect(result.reasoning).toContain('Action intent requires actions schema');
    });

    it('should force conversation intent when state requested but no state data', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'show the state',
        actions: { test_action: { params: [] } }, // Only actions provided, no state
      });

      expect(result.intent).toBe('conversation');
      expect(result.message).toBe('Defaulting to conversation - no state data available');
      expect(result.reasoning).toContain('State intent requires state data');
    });
  });
});