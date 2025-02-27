import { describe, expect, it, vi } from 'vitest';

import { Runtime } from '../index';
import type { CompletionResponse, LLMProvider } from '../types';

class MockProvider implements LLMProvider {
  async complete(prompt: string): Promise<CompletionResponse> {
    // Test intent determination
    if (prompt.includes('"intent": "action" | "state" | "conversation"')) {
      if (prompt.includes('mark the first incomplete todo as done')) {
        return {
          message: "Let's take action to complete that todo",
          action: { intent: 'action' },
        };
      } else if (prompt.includes('show my pending todos')) {
        return {
          message: "Let's check your todo list",
          action: { intent: 'state' },
        };
      }
      return {
        message: "Let's have a chat about that",
        action: { intent: 'conversation' },
      };
    }

    // Test action handling
    if (prompt.includes('Available Actions:')) {
      return {
        message: "I'll mark the todo as completed",
        action: {
          type: 'todos/toggleComplete',
          payload: { id: '2' },
        },
      };
    }

    // Test state handling
    if (prompt.includes('state')) {
      return {
        message: 'You have 2 pending todos: Walk dog, Code review',
        action: null,
      };
    }

    // Test conversation handling
    return {
      message: 'Here are the available actions...',
      action: null,
    };
  }
}

describe('Runtime', () => {
  let provider: LLMProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MockProvider();
  });

  describe('query', () => {
    it('should handle action intents and return valid actions', async () => {
      const runtime = new Runtime({ provider });
      const actions = {
        todos: {
          anyOf: [
            {
              properties: {
                type: { const: 'todos/toggleComplete' },
                payload: { type: 'object' },
              },
            },
          ],
        },
      };
      const state = {
        todos: [
          { id: '1', text: 'Buy milk', completed: true },
          { id: '2', text: 'Walk dog', completed: false },
          { id: '3', text: 'Code review', completed: false },
        ],
      };

      const response = await runtime.query({
        query: 'mark the first incomplete todo as done',
        actions,
        state,
        conversations:
          'Previous: show my todos\nAI: Here are your todos: Buy milk (done), Walk dog, Code review',
      });

      expect(response).toEqual({
        message: "I'll mark the todo as completed",
        action: {
          type: 'todos/toggleComplete',
          payload: { id: '2' },
        },
      });
    });

    it('should handle state queries', async () => {
      const runtime = new Runtime({ provider });
      const state = {
        todos: [
          { id: '1', text: 'Buy milk', completed: true },
          { id: '2', text: 'Walk dog', completed: false },
          { id: '3', text: 'Code review', completed: false },
        ],
      };

      const response = await runtime.query({
        query: 'show my pending todos',
        state,
        conversations: 'Previous: What have I completed?\nAI: You\'ve completed "Buy milk"',
      });

      expect(response).toEqual({
        message: 'You have 2 pending todos: Walk dog, Code review',
        action: null,
      });
    });

    it('should handle conversation mode for general queries', async () => {
      const runtime = new Runtime({ provider });
      const conversations = 'Previous: help\nAI: Here are the available actions...';

      const response = await runtime.query({
        query: 'help me understand',
        conversations,
      });

      expect(response).toEqual({
        message: 'Here are the available actions...',
        action: null,
      });
    });

    it('should handle errors from provider', async () => {
      const errorProvider = {
        complete: vi.fn().mockRejectedValue(new Error('Provider error')),
      } as LLMProvider;

      const runtime = new Runtime({ provider: errorProvider });

      await expect(
        runtime.query({
          query: 'test',
          actions: {},
          state: {},
          conversations: '',
        })
      ).rejects.toThrow('Provider error');
    });
  });
});
