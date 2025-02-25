import type { CompletionResponse, LLMProvider } from './provider';
import type { Message } from './types';

export interface RuntimeConfig {
  provider: LLMProvider;
  debug?: boolean;
}

export class Runtime {
  private provider: LLMProvider;
  private debug: boolean;

  constructor(config: RuntimeConfig) {
    this.provider = config.provider;
    this.debug = config.debug ?? false;
  }

  async query(params: {
    query: string;
    prompt: string;
    currentState?: Record<string, unknown>;
  }) {
    try {
      const { query, prompt, currentState } = params;

      if (!query) {
        throw new Error('Query is required');
      }

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      const messages = [
        { role: 'system' as const, content: prompt },
        { role: 'user' as const, content: query },
      ];

      const response = await this.provider.complete(messages, currentState);

      return response;
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error]:', error);
      }
      throw error;
    }
  }
}

// Add factory function to create Runtime instances
export function createRuntime(config: RuntimeConfig): Runtime {
  return new Runtime(config);
}

// Re-export all types
export type { CompletionResponse, LLMProvider, Message };
export { BaseAdapter, type RuntimeAdapter, type RuntimeAdapterConfig, type AdapterRequest, type AdapterResponse } from './adapter';