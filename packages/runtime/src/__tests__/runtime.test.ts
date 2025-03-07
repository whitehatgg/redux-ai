import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import { DEFAULT_PROMPTS } from '../prompts';
import type { CompletionResponse, IntentCompletionResponse, Message } from '../types';

const defaultReasoning = [
  'Initial observation: Processing user query',
  'Analysis: Determining appropriate action',
  'Decision: Executing selected response'
];

class MockProvider extends BaseLLMProvider {
  responses: Array<CompletionResponse | IntentCompletionResponse>;
  debug: boolean;

  constructor(responses: Array<CompletionResponse | IntentCompletionResponse>, debug = true) {
    super({ timeout: 30000, debug });
    this.responses = [...responses];
    this.debug = debug;
  }

  protected convertMessage(_message: Message): unknown {
    return {};
  }

  protected async completeRaw(): Promise<unknown> {
    const response = this.responses[0];
    return response;
  }

  async complete(prompt: string): Promise<CompletionResponse | IntentCompletionResponse> {
    if (this.debug) {
      console.log('Processing prompt:', prompt);
    }

    const response = this.responses.shift();
    if (!response) {
      throw new Error('No more mock responses');
    }

    // Determine if this is an intent classification call
    const isIntentCall = prompt.includes(DEFAULT_PROMPTS.intent);

    if (this.debug) {
      console.log(`Call type: ${isIntentCall ? 'Intent classification' : 'Final response'}`);
      console.log('Current response:', JSON.stringify(response, null, 2));
    }

    // For intent classification, return the intent response directly
    if (isIntentCall) {
      if (!('intent' in response)) {
        throw new Error('Expected intent response for intent classification');
      }

      return {
        intent: response.intent,
        message: response.message,
        reasoning: defaultReasoning
      };
    }

    // For final response, ensure no intent field
    return {
      message: response.message,
      action: 'action' in response ? response.action : null,
      reasoning: defaultReasoning
    };
  }
}

describe('Runtime Chain-of-Thought Reasoning', () => {
  describe('State Query Handling', () => {
    it('should process state queries with reasoning', async () => {
      const provider = new MockProvider([
        {
          intent: 'state',
          message: 'Processing state query',
          reasoning: defaultReasoning
        },
        {
          message: 'Die aktuelle Liste der Bewerber zeigt...',
          action: null,
          reasoning: defaultReasoning
        }
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({ query: "What's the state" });

      expect(result).toEqual({
        message: 'Die aktuelle Liste der Bewerber zeigt...',
        action: null,
        reasoning: defaultReasoning
      });
    });
  });

  describe('Action Processing', () => {
    it('should process actions with proper reasoning steps', async () => {
      const provider = new MockProvider([
        {
          intent: 'action',
          message: 'Processing action request',
          reasoning: defaultReasoning
        },
        {
          message: 'Task creation initiated...',
          action: null,
          reasoning: defaultReasoning
        }
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'create task "Test Task"',
        actions: { 'task/create': { description: 'Create a task', params: ['title'] } }
      });

      expect(result).toEqual({
        message: 'Task creation initiated...',
        action: null,
        reasoning: defaultReasoning
      });
    });
  });

  describe('Conversation Handling', () => {
    it('should include reasoning chains in responses', async () => {
      const provider = new MockProvider([
        {
          intent: 'conversation',
          message: 'Processing conversation',
          reasoning: defaultReasoning
        },
        {
          message: 'Hello! How can I assist you today?',
          action: null,
          reasoning: defaultReasoning
        }
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({ query: 'hi there' });

      expect(result).toEqual({
        message: 'Hello! How can I assist you today?',
        action: null,
        reasoning: defaultReasoning
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', async () => {
      const provider = new MockProvider([]);
      vi.spyOn(provider, 'complete').mockRejectedValue(new Error('Provider error'));

      const runtime = createRuntime({ provider });
      await expect(runtime.query({ query: 'test' })).rejects.toThrow('Provider error');
    });

    it('should handle empty mock responses', async () => {
      const provider = new MockProvider([]);
      const runtime = createRuntime({ provider });
      await expect(runtime.query({ query: 'test' })).rejects.toThrow('No more mock responses');
    });
  });
});