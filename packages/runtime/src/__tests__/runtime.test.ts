import { describe, expect, it } from 'vitest';
import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import type { CompletionResponse, IntentCompletionResponse, Message } from '../types';

// Mock provider for testing dynamic prompts
class MockProvider extends BaseLLMProvider {
  protected convertMessage(message: Message): unknown {
    return message;
  }

  protected async completeRaw(messages: Message[]): Promise<CompletionResponse | IntentCompletionResponse> {
    // Check message content for prompt type
    const content = messages[0].content;

    // Intent classification prompt
    if (content.includes('INTENT CLASSIFICATION RULES')) {
      return {
        intent: 'action',
        message: 'Classified as action query',
        reasoning: ['Test reasoning']
      };
    }

    // Action/state prompt response
    return {
      message: 'Mock response',
      action: content.includes('action') ? { type: 'test_action' } : null,
      reasoning: ['Test reasoning']
    };
  }
}

describe('Runtime Dynamic Prompt Tests', () => {
  const mockProvider = new MockProvider();

  describe('Intent Classification', () => {
    it('should properly process intent with complete context', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'perform action',
        actions: { test_action: { params: [] } }
      });

      expect(result).toEqual({
        message: 'Mock response',
        action: { type: 'test_action' },
        reasoning: ['Test reasoning']
      });
    });
  });

  describe('Action Processing', () => {
    it('should process action with required schema', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'perform action',
        actions: {
          test_action: {
            params: ['param1'],
            required: ['param1']
          }
        }
      });

      expect(result).toEqual({
        message: 'Mock response',
        action: { type: 'test_action' },
        reasoning: ['Test reasoning']
      });
    });
  });

  describe('State Handling', () => {
    it('should process state query with valid state data', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'check state',
        state: { test: true }
      });

      expect(result).toEqual({
        message: 'Mock response',
        action: null,
        reasoning: ['Test reasoning']
      });
    });

    it('should throw error for state query without state data', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      await expect(runtime.query({
        query: 'check state'
      })).rejects.toThrow('State prompt requires state data');
    });
  });
});