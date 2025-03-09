import type { Message } from '@redux-ai/runtime/dist/types';
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
});