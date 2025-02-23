import { describe, expect, it, vi } from 'vitest';
import { LangChainProvider } from '../index';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Message } from '@redux-ai/runtime';

/**
 * Test suite for LangChain package
 * 
 * Mocking Best Practices:
 * 1. Use factory pattern with vi.mock to ensure proper hoisting in all environments
 * 2. Define mock factory inside vi.mock to avoid initialization order issues
 * 3. Return class constructor that creates fresh mock instances
 * 4. Avoid using top-level variables in mock definitions
 */

// Configure the mock before tests
vi.mock('@langchain/core/language_models/chat_models', () => {
  const createMockModel = () => ({
    call: vi.fn()
  });

  return {
    BaseChatModel: class MockChatModel {
      constructor() {
        return createMockModel();
      }
    }
  };
});

describe('LangChainProvider', () => {
  it('should properly initialize with a model', () => {
    const provider = new LangChainProvider({ model: new BaseChatModel() });
    expect(provider).toBeInstanceOf(LangChainProvider);
  });

  it('should handle message conversion and completion', async () => {
    const provider = new LangChainProvider({ model: new BaseChatModel() });
    const mockResponse = { text: JSON.stringify({ message: 'Test response', action: null }) };
    (provider.model.call as any).mockResolvedValue(mockResponse);

    const messages: Message[] = [
      { role: 'system' as const, content: 'You are a test assistant' },
      { role: 'user' as const, content: 'Hello' }
    ];

    const response = await provider.complete(messages);
    expect(response).toEqual({ message: 'Test response', action: null });
    expect(provider.model.call).toHaveBeenCalledWith([
      new SystemMessage('You are a test assistant'),
      new HumanMessage('Hello')
    ]);
  });

  it('should handle non-JSON responses', async () => {
    const provider = new LangChainProvider({ model: new BaseChatModel() });
    const mockResponse = { text: 'Plain text response' };
    (provider.model.call as any).mockResolvedValue(mockResponse);

    const messages: Message[] = [{ role: 'user' as const, content: 'Hello' }];
    const response = await provider.complete(messages);

    expect(response).toEqual({
      message: 'Plain text response',
      action: null
    });
  });

  it('should throw error for invalid response format', async () => {
    const provider = new LangChainProvider({ model: new BaseChatModel() });
    const mockResponse = { text: null };
    (provider.model.call as any).mockResolvedValue(mockResponse);

    const messages: Message[] = [{ role: 'user' as const, content: 'Hello' }];
    await expect(provider.complete(messages)).rejects.toThrow('Unexpected response format');
  });
});