import { describe, expect, it, vi } from 'vitest';
import type { OpenAIConfig } from '../index';
import { OpenAIProvider } from '../index';
import type { Message } from '@redux-ai/runtime';

/**
 * Test suite for OpenAI package
 * 
 * Mocking Best Practices:
 * 1. Use factory pattern with vi.mock to ensure proper hoisting in all environments
 * 2. Define mock factory inside vi.mock to avoid initialization order issues
 * 3. Return class constructor that creates fresh mock instances
 * 4. Avoid using top-level variables in mock definitions
 */

// Configure the mock before tests
vi.mock('openai', () => {
  const createMockClient = () => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  });

  return {
    default: class MockOpenAI {
      constructor() {
        return createMockClient();
      }
    }
  };
});

describe('OpenAI Package', () => {
  const mockConfig: OpenAIConfig = {
    apiKey: 'test-key',
    model: 'gpt-3.5-turbo'
  };

  it('should properly initialize OpenAI client', () => {
    const provider = new OpenAIProvider(mockConfig);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should handle API calls correctly', async () => {
    const provider = new OpenAIProvider(mockConfig);
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ message: 'Test response', action: null })
        }
      }]
    };

    // @ts-ignore - Mocking private OpenAI instance
    provider.client.chat.completions.create.mockResolvedValue(mockResponse);

    const messages: Message[] = [{ role: 'user' as const, content: 'Hello' }];
    const response = await provider.complete(messages);

    expect(response).toEqual({ message: 'Test response', action: null });
  });

  it('should properly handle API errors', async () => {
    const provider = new OpenAIProvider(mockConfig);
    const mockError = new Error('API Error');

    // @ts-ignore - Mocking private OpenAI instance
    provider.client.chat.completions.create.mockRejectedValue(mockError);

    const messages: Message[] = [{ role: 'user' as const, content: 'Hello' }];
    await expect(provider.complete(messages)).rejects.toThrow('API Error');
  });
});