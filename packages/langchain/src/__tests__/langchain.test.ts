import type { CompletionResponse, Message } from '@redux-ai/runtime/dist/types';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

import { LangChainProvider } from '../index';

// Mock implementation matching BaseChatModel interface
class MockChatModel {
  lc_namespace = ['langchain', 'chat_models'];
  lc_serializable = true;

  invoke = vi.fn().mockImplementation(async () => ({
    content: 'Test response',
  }));

  _modelType() {
    return 'chat_model' as const;
  }
}

describe('LangChainProvider', () => {
  it('should properly initialize with a model', () => {
    const provider = new LangChainProvider({
      model: new MockChatModel() as unknown as BaseChatModel,
      timeout: 5000,
      debug: false,
    });
    expect(provider).toBeInstanceOf(LangChainProvider);
  });

  it('should process messages correctly', async () => {
    const mockModel = new MockChatModel();
    const provider = new LangChainProvider({
      model: mockModel as unknown as BaseChatModel,
      timeout: 5000,
      debug: false,
    });

    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];

    const result = await provider.completeRaw(messages);
    expect(result).toBe('Test response');
    expect(mockModel.invoke).toHaveBeenCalled();
  });
});