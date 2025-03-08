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
  private responses: Array<CompletionResponse | IntentCompletionResponse>;
  private debug: boolean;

  constructor(responses: Array<CompletionResponse | IntentCompletionResponse>, debug = false) {
    super({ timeout: 30000, debug });
    this.responses = [...responses];
    this.debug = debug;
  }

  protected convertMessage(message: Message): unknown {
    return {
      role: message.role,
      content: message.content,
    };
  }

  protected async completeRaw(messages: Message[]): Promise<unknown> {
    if (this.debug) {
      console.debug('Processing messages:', messages);
    }

    const response = this.responses.shift();
    if (!response) {
      throw new Error('No more mock responses');
    }

    // Always include the default reasoning array in the response
    if ('intent' in response) {
      return {
        intent: response.intent,
        message: response.message,
        reasoning: defaultReasoning
      };
    }

    return {
      message: response.message,
      action: response.action,
      reasoning: defaultReasoning
    };
  }
}

describe('Runtime Chain-of-Thought Reasoning', () => {
  let provider: MockProvider;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('State Query Handling', () => {
    it('should process state queries with reasoning', async () => {
      provider = new MockProvider([
        {
          intent: 'state',
          message: 'Processing state query',
          reasoning: defaultReasoning
        },
        {
          message: 'State data retrieved successfully',
          action: null,
          reasoning: defaultReasoning
        }
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({ query: "What's the state" });

      expect(result).toEqual({
        message: 'State data retrieved successfully',
        action: null,
        reasoning: defaultReasoning
      });
    });
  });

  describe('Action Processing', () => {
    it('should process actions with proper reasoning steps', async () => {
      provider = new MockProvider([
        {
          intent: 'action',
          message: 'Processing action request',
          reasoning: defaultReasoning
        },
        {
          message: 'Action executed successfully',
          action: { type: 'TEST_ACTION' },
          reasoning: defaultReasoning
        }
      ]);

      const runtime = createRuntime({ provider });
      const result = await runtime.query({
        query: 'create task "Test Task"',
        actions: { 'task/create': { description: 'Create a task', params: ['title'] } }
      });

      expect(result).toEqual({
        message: 'Action executed successfully',
        action: { type: 'TEST_ACTION' },
        reasoning: defaultReasoning
      });
    });
  });

  describe('Conversation Handling', () => {
    it('should include reasoning chains in responses', async () => {
      provider = new MockProvider([
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
      provider = new MockProvider([]);
      vi.spyOn(provider, 'createCompletion').mockRejectedValue(new Error('Provider error'));

      const runtime = createRuntime({ provider });
      await expect(runtime.query({ query: 'test' })).rejects.toThrow('Provider error');
    });

    it('should handle empty mock responses', async () => {
      provider = new MockProvider([]);
      const runtime = createRuntime({ provider });
      await expect(runtime.query({ query: 'test' })).rejects.toThrow('No more mock responses');
    });
  });
});