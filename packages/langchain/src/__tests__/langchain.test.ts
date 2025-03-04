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
    content: JSON.stringify({ message: 'Test response', action: null }),
  }));

  _modelType() {
    return 'chat_model' as const;
  }
}

describe(
  'LangChainProvider',
  () => {
    it('should properly initialize with a model', () => {
      const provider = new LangChainProvider({
        model: new MockChatModel() as unknown as BaseChatModel,
        timeout: 5000,
        debug: false,
      });
      expect(provider).toBeInstanceOf(LangChainProvider);
    });

    it('should process messages and return valid response', async () => {
      const mockModel = new MockChatModel();
      const provider = new LangChainProvider({
        model: mockModel as unknown as BaseChatModel,
        timeout: 5000,
        debug: false,
      });

      const mockResponse = {
        content: JSON.stringify({ message: 'Test response', action: null }),
      };
      mockModel.invoke.mockResolvedValue(mockResponse);

      const response = await provider.complete('Hello');
      expect(response).toEqual({ message: 'Test response', action: null });
    });

    it('should handle non-JSON responses', async () => {
      const mockModel = new MockChatModel();
      const provider = new LangChainProvider({
        model: mockModel as unknown as BaseChatModel,
        timeout: 5000,
        debug: false,
      });

      // Return a plain string to trigger JSON parse error
      const mockResponse = { content: 'not a json string' };
      mockModel.invoke.mockResolvedValue(mockResponse);

      await expect(provider.complete('Hello')).rejects.toThrow(
        'Invalid JSON response from provider'
      );
    });

    it('should handle invalid response content', async () => {
      const mockModel = new MockChatModel();
      const provider = new LangChainProvider({
        model: mockModel as unknown as BaseChatModel,
        timeout: 5000,
        debug: false,
      });

      // Return a non-object response after JSON parsing
      const mockResponse = { content: 'null' };
      mockModel.invoke.mockResolvedValue(mockResponse);

      await expect(provider.complete('Hello')).rejects.toThrow('Invalid response: not an object');
    });
  },
  { timeout: 10000 }
);
