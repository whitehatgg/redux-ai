import type { Message } from '@redux-ai/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OpenAIConfig } from '../index';
import { OpenAIProvider } from '../index';

// Mock must be defined before module imports
const mockCompletionsCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: mockCompletionsCreate,
      },
    },
  })),
}));

describe('OpenAI Provider', () => {
  let mockConfig: OpenAIConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      apiKey: 'test-key',
      model: 'gpt-4o',
      temperature: 0.7,
    };
  });

  it('should properly initialize OpenAI client', () => {
    const provider = new OpenAIProvider(mockConfig);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should handle pipeline responses correctly', async () => {
    const provider = new OpenAIProvider(mockConfig);

    mockCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: 'Processing multi-step request',
              intent: 'pipeline',
              action: null,
              reasoning: ['Processing pipeline steps'],
              pipeline: [
                {
                  message: 'search for John',
                  intent: 'action',
                  action: { type: 'search', payload: { term: 'John' } },
                  reasoning: ['First step: Search operation'],
                },
                {
                  message: 'disable name column',
                  intent: 'action',
                  action: { type: 'setVisibleColumns', payload: { columns: ['email', 'status'] } },
                  reasoning: ['Second step: Column visibility'],
                },
              ],
            }),
          },
        },
      ],
    });

    const messages: Message[] = [{ role: 'user', content: 'search for John and disable name' }];
    const response = await provider.createCompletion(messages);

    expect(response.intent).toBe('pipeline');
    expect(response.action).toBeNull();
    expect(response.pipeline).toBeDefined();
    expect(response.pipeline).toHaveLength(2);

    // Verify first step (action)
    expect(response.pipeline![0]).toEqual({
      message: 'search for John',
      intent: 'action',
      action: { type: 'search', payload: { term: 'John' } },
      reasoning: ['First step: Search operation'],
    });

    // Verify second step (action)
    expect(response.pipeline![1]).toEqual({
      message: 'disable name column',
      intent: 'action',
      action: { type: 'setVisibleColumns', payload: { columns: ['email', 'status'] } },
      reasoning: ['Second step: Column visibility'],
    });
  });

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
              intent: 'conversation',
            }),
          },
        },
      ],
    });

    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const response = await provider.createCompletion(messages);

    expect(response).toEqual({
      message: 'Test response',
      action: null,
      reasoning: ['Test reasoning step'],
      intent: 'conversation',
    });
  });

  it('should handle pipeline validation', async () => {
    const provider = new OpenAIProvider(mockConfig);

    mockCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: 'Processing pipeline',
              intent: 'pipeline',
              action: null,
              reasoning: ['Pipeline test'],
              pipeline: [
                {
                  message: 'first step',
                  intent: 'action',
                  action: { type: 'test' },
                  reasoning: ['Test step'],
                },
              ],
            }),
          },
        },
      ],
    });

    const messages: Message[] = [{ role: 'user', content: 'test pipeline' }];
    const response = await provider.createCompletion(messages);

    expect(response.intent).toBe('pipeline');
    expect(response.pipeline).toBeDefined();
    expect(response.pipeline![0].message).toBe('first step');
  });

  it('should handle API errors gracefully', async () => {
    const provider = new OpenAIProvider(mockConfig);
    mockCompletionsCreate.mockRejectedValue(new Error('API Error'));

    const messages: Message[] = [{ role: 'user', content: 'test error' }];
    await expect(provider.createCompletion(messages)).rejects.toThrow('API Error');
  });
});
