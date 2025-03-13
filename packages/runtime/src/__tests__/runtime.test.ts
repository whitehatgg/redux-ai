import { describe, expect, it, vi } from 'vitest';
import { createRuntime } from '../index';
import { BaseLLMProvider } from '../provider';
import type { IntentCompletionResponse, Message } from '../types';

vi.mock('../prompts', () => ({
  generatePrompt: () => 'TEST'
}));

class TestProvider extends BaseLLMProvider {
  protected convertMessage(message: Message): Message {
    return message;
  }

  protected async completeRaw(): Promise<IntentCompletionResponse> {
    return {
      intent: 'conversation',
      message: 'Test response',
      reasoning: ['Test'],
      action: null
    };
  }
}

describe('Runtime', () => {
  it('initializes with provider', () => {
    const provider = new TestProvider();
    const runtime = createRuntime({ provider });
    expect(runtime).toBeDefined();
  });

  it('processes simple queries', async () => {
    const provider = new TestProvider();
    const runtime = createRuntime({ provider });
    const result = await runtime.query({ query: 'test' });
    expect(result.intent).toBe('conversation');
    expect(result.action).toBeNull();
  });
});