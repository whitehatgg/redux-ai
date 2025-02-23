import type { Message } from '@redux-ai/runtime';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

import { LangChainProvider } from '../index';

// Mock implementation matching BaseChatModel interface
class MockChatModel {
  // Required BaseChatModel properties
  lc_namespace = ['langchain', 'chat_models'];
  lc_serializable = true;

  invoke = vi.fn().mockImplementation(async () => ({
    content: JSON.stringify({ message: 'Test response', action: null }),
  }));

  _modelType() {
    return 'chat_model' as const;
  }
}

describe('LangChainProvider', () => {
  it('should properly initialize with a model', () => {
    const provider = new LangChainProvider({
      model: new MockChatModel() as unknown as BaseChatModel,
    });
    expect(provider).toBeInstanceOf(LangChainProvider);
  });

  it('should handle message conversion and completion', async () => {
    const mockModel = new MockChatModel();
    const provider = new LangChainProvider({
      model: mockModel as unknown as BaseChatModel,
    });

    const mockResponse = {
      content: JSON.stringify({ message: 'Test response', action: null }),
    };
    mockModel.invoke.mockResolvedValue(mockResponse);

    const messages: Message[] = [
      { role: 'system', content: 'You are a test assistant' },
      { role: 'user', content: 'Hello' },
    ];

    const response = await provider.complete(messages);
    expect(response).toEqual({ message: 'Test response', action: null });

    // Verify correct message conversion
    expect(mockModel.invoke).toHaveBeenCalledWith([
      new SystemMessage('You are a test assistant'),
      new HumanMessage('Hello'),
    ]);
  });

  it('should handle non-JSON responses', async () => {
    const mockModel = new MockChatModel();
    const provider = new LangChainProvider({
      model: mockModel as unknown as BaseChatModel,
    });
    const mockResponse = { content: 'Plain text response' };
    mockModel.invoke.mockResolvedValue(mockResponse);

    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const response = await provider.complete(messages);

    expect(response).toEqual({
      message: 'Plain text response',
      action: null,
    });
  });

  it('should throw error for invalid response format', async () => {
    const mockModel = new MockChatModel();
    const provider = new LangChainProvider({
      model: mockModel as unknown as BaseChatModel,
    });
    const mockResponse = { content: null };
    mockModel.invoke.mockResolvedValue(mockResponse);

    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    await expect(provider.complete(messages)).rejects.toThrow('Unexpected response format');
  });
});
