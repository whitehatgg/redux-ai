import { vi } from 'vitest';

// Mock must be defined before module imports
const mockCompletionsCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: mockCompletionsCreate
      }
    }
  }))
}));

import type { Message } from '@redux-ai/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import type { OpenAIConfig } from '../index';
import { OpenAIProvider } from '../index';

describe('OpenAI Provider', () => {
  let mockConfig: OpenAIConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      apiKey: 'test-key',
      model: 'gpt-4',
      debug: true
    };
  });

  it('should properly initialize OpenAI client', () => {
    const provider = new OpenAIProvider(mockConfig);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should handle workflow responses correctly', async () => {
    const provider = new OpenAIProvider(mockConfig);

    // Mock a workflow response
    mockCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: 'Processing multi-step request',
              intent: 'workflow',
              action: null,
              reasoning: ['Processing workflow steps'],
              workflow: [
                {
                  message: 'search for John',
                  intent: 'action',
                  action: { type: 'search', payload: { term: 'John' } },
                  reasoning: ['First step: Search operation']
                },
                {
                  message: 'disable name column',
                  intent: 'action',
                  action: { type: 'setVisibleColumns', payload: { columns: ['email', 'status'] } },
                  reasoning: ['Second step: Column visibility']
                },
                {
                  message: 'tell me a joke',
                  intent: 'conversation',
                  action: null,
                  reasoning: ['Final step: Conversation request']
                }
              ]
            })
          }
        }
      ]
    });

    const messages: Message[] = [{ role: 'user', content: 'search for John, disable name, tell me a joke' }];
    const response = await provider.createCompletion(messages);

    expect(response.intent).toBe('workflow');
    expect(response.action).toBeNull();
    expect(response.workflow).toBeDefined();
    expect(response.workflow).toHaveLength(3);

    // Verify first step (action)
    expect(response.workflow![0]).toEqual({
      message: 'search for John',
      intent: 'action',
      action: { type: 'search', payload: { term: 'John' } },
      reasoning: ['First step: Search operation']
    });

    // Verify second step (action)
    expect(response.workflow![1]).toEqual({
      message: 'disable name column',
      intent: 'action',
      action: { type: 'setVisibleColumns', payload: { columns: ['email', 'status'] } },
      reasoning: ['Second step: Column visibility']
    });

    // Verify third step (conversation)
    expect(response.workflow![2]).toEqual({
      message: 'tell me a joke',
      intent: 'conversation',
      action: null,
      reasoning: ['Final step: Conversation request']
    });
  }, 10000); // Increase timeout for OpenAI response

  it('should handle basic conversation responses', async () => {
    const provider = new OpenAIProvider(mockConfig);

    mockCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: 'Test response',
              action: null,
              reasoning: ['Test reasoning step'],
              intent: 'conversation'
            })
          }
        }
      ]
    });

    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const response = await provider.createCompletion(messages);

    expect(response).toEqual({
      message: 'Test response',
      action: null,
      reasoning: ['Test reasoning step'],
      intent: 'conversation'
    });
  });

  it('should reject invalid workflow step formats', async () => {
    const provider = new OpenAIProvider(mockConfig);

    // Mock an invalid workflow response (missing required fields)
    mockCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: 'Processing workflow',
              intent: 'workflow',
              action: null,
              reasoning: ['Invalid workflow test'],
              workflow: [
                {
                  // Missing message field
                  intent: 'action',
                  action: { type: 'search' }
                }
              ]
            })
          }
        }
      ]
    });

    const messages: Message[] = [{ role: 'user', content: 'test workflow' }];
    const response = await provider.createCompletion(messages);

    // Should fall back to conversation intent due to invalid workflow
    expect(response.intent).toBe('conversation');
    expect(response.action).toBeNull();
    expect(response.workflow).toBeUndefined();
    expect(response.message).toContain('try again');
  });

  it('should handle API errors gracefully', async () => {
    const provider = new OpenAIProvider(mockConfig);
    const mockError = new Error('API Error');
    mockCompletionsCreate.mockRejectedValue(mockError);

    const messages: Message[] = [{ role: 'user', content: 'test error' }];
    const response = await provider.createCompletion(messages);

    expect(response.intent).toBe('conversation');
    expect(response.action).toBeNull();
    expect(response.message).toContain('try again');
    expect(response.reasoning).toContain('API request failed');
  });
});