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
      model: 'gpt-4o',
      debug: true
    };

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
  });

  it('should properly initialize OpenAI client', () => {
    const provider = new OpenAIProvider(mockConfig);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should handle API calls correctly', async () => {
    const provider = new OpenAIProvider(mockConfig);
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];

    const response = await provider.complete(messages);

    expect(response).toEqual({
      message: 'Test response',
      action: null,
      reasoning: ['Test reasoning step'],
      intent: 'conversation'
    });
  });

  it('should handle API errors gracefully', async () => {
    const provider = new OpenAIProvider(mockConfig);
    const mockError = new Error('API Error');
    mockCompletionsCreate.mockRejectedValueOnce(mockError);

    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    await expect(provider.complete(messages)).rejects.toThrow('API Error');
  });
});