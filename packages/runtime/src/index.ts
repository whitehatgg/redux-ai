import type { HandlerConfig, RuntimeAdapter } from './adapter';
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
    actions: string[];
    currentState?: Record<string, unknown>;
  }) {
    try {
      const { query, prompt, actions, currentState } = params;

      if (!query) {
        throw new Error('Query is required');
      }

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      if (!Array.isArray(actions) || !actions.length) {
        throw new Error('Actions must be a non-empty array');
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

export type { Message, LLMProvider, CompletionResponse, RuntimeAdapter, HandlerConfig };
export * from './types';
