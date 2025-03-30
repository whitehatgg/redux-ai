import { describe, expect, it } from 'vitest';

import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import type { CompletionResponse, IntentCompletionResponse, Message } from '../types';

class TestProvider extends BaseLLMProvider {
  protected convertMessage(message: Message): unknown {
    return message;
  }

  protected async completeRaw(
    messages: Message[]
  ): Promise<CompletionResponse | IntentCompletionResponse> {
    const systemPrompt = messages[0].content;
    const userQuery = messages[1]?.content || '';

    // Handle intent classification
    if (systemPrompt.includes('INTENT CLASSIFICATION RULES')) {
      if (userQuery.includes('and then')) {
        return {
          intent: 'pipeline',
          message: 'Query contains multiple sequential operations',
          reasoning: ['Multiple operations detected'],
          action: null,
        };
      } else if (userQuery.includes('create')) {
        return {
          intent: 'action',
          message: 'Query indicates action intent',
          reasoning: ['Action keywords detected'],
          action: null,
        };
      } else if (userQuery.includes('show')) {
        return {
          intent: 'state',
          message: 'Query requests state information',
          reasoning: ['State request detected'],
          action: null,
        };
      }
      return {
        intent: 'conversation',
        message: 'General conversation query',
        reasoning: ['No specific intent detected'],
        action: null,
      };
    }

    // Handle pipeline processing
    if (systemPrompt.includes('WORKFLOW RULES') || systemPrompt.includes('PIPELINE RULES')) {
      return {
        message: 'Processing pipeline steps',
        action: null,
        reasoning: ['Pipeline steps identified'],
        intent: 'pipeline',
        pipeline: [
          {
            message: 'create a task',
            intent: 'action',
            reasoning: ['First step: Create task'],
            action: { type: 'task/create', payload: { title: 'New Task' } },
          },
          {
            message: 'show all tasks',
            intent: 'state',
            reasoning: ['Second step: View tasks'],
            action: null,
          },
        ],
      };
    }

    // Handle action processing
    if (userQuery.includes('create a task')) {
      return {
        message: 'Task created',
        action: {
          type: 'task/create',
          payload: { title: 'New Task' },
        },
        reasoning: ['Created task with default title'],
        intent: 'action',
      };
    }

    // Handle state processing
    if (userQuery.includes('show all tasks')) {
      return {
        message: 'Current tasks: []',
        action: null,
        reasoning: ['Retrieved current task list'],
        intent: 'state',
      };
    }

    // Default conversation response
    return {
      message: 'Conversation response',
      action: null,
      reasoning: ['Default response'],
      intent: 'conversation',
    };
  }
}

describe('Runtime Dynamic Prompt Tests', () => {
  const mockProvider = new TestProvider();

  describe('Intent Classification', () => {
    it('should classify state query with state context', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'show all tasks',
        state: { tasks: [] },
      });

      expect(result.intent).toBe('state');
      expect(result.action).toBeNull();
    });

    it('should classify as action when valid', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'create a task',
        actions: { test_action: { params: [] } },
      });

      expect(result.intent).toBe('action');
      expect(result.action).toBeDefined();
    });

    it('should handle multi-step pipeline intents', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'create a task and then show all tasks',
        actions: { test_action: { params: [] } },
        state: { tasks: [] },
      });

      expect(result.intent).toBe('pipeline');
      expect(result.pipeline).toBeDefined();
      expect(Array.isArray(result.pipeline)).toBe(true);
      expect(result.pipeline).toHaveLength(2);
      expect(result.action).toBeNull();

      const [firstStep, secondStep] = result.pipeline!;

      expect(firstStep.intent).toBe('action');
      expect(firstStep.message).toBe('Task created');
      expect(firstStep.action).toBeDefined();
      expect(firstStep.action?.type).toBe('task/create');

      expect(secondStep.intent).toBe('state');
      expect(secondStep.message).toBe('Current tasks: []');
      expect(secondStep.action).toBeNull();
    });

    it('should default to conversation without specific context', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'hello there',
      });

      expect(result.intent).toBe('conversation');
      expect(result.action).toBeNull();
    });
  });
});
