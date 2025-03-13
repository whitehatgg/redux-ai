import { beforeEach, describe, expect, it } from 'vitest';
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

    // Handle workflow prompts specifically
    if (systemPrompt.includes('WORKFLOW')) {
      return {
        message: 'Processing workflow steps',
        steps: [
          {
            query: 'create a task',
            message: 'Task created',
            intent: 'action',
            reasoning: ['First step: Create task'],
            action: { type: 'task/create', payload: { title: 'New Task' } }
          },
          {
            query: 'show all tasks',
            message: 'Current tasks: []',
            intent: 'state',
            reasoning: ['Second step: View tasks'],
            action: null
          }
        ],
        reasoning: ['Workflow steps identified'],
        action: null,
        intent: 'workflow'
      };
    }

    // Handle intent classification
    if (systemPrompt.includes('INTENT CLASSIFICATION')) {
      if (userQuery.includes('and then')) {
        return {
          intent: 'workflow',
          message: 'Processing workflow steps',
          steps: [
            { query: 'create a task', message: 'Task created', intent: 'action', reasoning: ['First step: Create task'], action: { type: 'task/create', payload: { title: 'New Task' } } },
            { query: 'show all tasks', message: 'Current tasks: []', intent: 'state', reasoning: ['Second step: View tasks'], action: null }
          ],
          reasoning: ['Multiple operations detected', 'Workflow steps identified'],
          action: null
        };
      } else if (userQuery.includes('create')) {
        return {
          intent: 'action',
          message: 'Task created',
          reasoning: ['Action keywords detected'],
          action: { type: 'task/create', payload: { title: 'New Task' } }
        };
      } else if (userQuery.includes('show')) {
        return {
          intent: 'state',
          message: 'Current tasks: []',
          reasoning: ['State request detected'],
          action: null
        };
      }
      return {
        intent: 'conversation',
        message: 'General conversation query',
        reasoning: ['No specific intent detected'],
        action: null
      };
    }

    // Return appropriate response based on query content
    if (userQuery.includes('create a task')) {
      return {
        message: 'Task created',
        action: {
          type: 'task/create',
          payload: { title: 'New Task' }
        },
        reasoning: ['Created task with default title'],
        intent: 'action'
      };
    }

    if (userQuery.includes('show all tasks')) {
      return {
        message: 'Current tasks: []',
        action: null,
        reasoning: ['Retrieved current task list'],
        intent: 'state'
      };
    }

    return {
      message: 'Assistance-focused response',
      action: null,
      reasoning: ['Default assistance response'],
      intent: 'conversation'
    };
  }
}

describe('Runtime Dynamic Prompt Tests', () => {
  const mockProvider = new MockProvider();

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

    it('should handle multi-step workflow intents', async () => {
      const runtime = createRuntime({ provider: mockProvider });
      const result = await runtime.query({
        query: 'create a task and then show all tasks',
        actions: { test_action: { params: [] } },
        state: { tasks: [] },
      });

      expect(result.intent).toBe('workflow');
      expect(result.workflow).toBeDefined();
      expect(Array.isArray(result.workflow)).toBe(true);
      expect(result.workflow).toHaveLength(2);
      expect(result.action).toBeNull();

      const [firstStep, secondStep] = result.workflow!;

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