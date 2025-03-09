import { generatePrompt } from './prompts';
import { BaseLLMProvider } from './provider';
import type {
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  QueryParams,
  RuntimeBase,
  RuntimeConfig,
} from './types';

export class RuntimeImpl implements RuntimeBase {
  private provider: BaseLLMProvider;
  public readonly debug: boolean;

  constructor(config: RuntimeConfig) {
    this.provider = config.provider;
    this.debug = config.debug ?? false;
  }

  private async processIntent(params: QueryParams): Promise<IntentCompletionResponse> {
    if (this.debug) {
      console.debug('[Runtime Debug] Processing intent:', {
        query: params.query,
        hasActions: !!params.actions,
        hasState: !!params.state,
        params
      });
    }

    const messages: Message[] = [
      { role: 'system', content: generatePrompt('intent', params) },
      { role: 'user', content: params.query }
    ];

    const response = await this.provider.createCompletion(messages);

    if (!('intent' in response)) {
      throw new Error('Invalid intent response format');
    }

    return response as IntentCompletionResponse;
  }

  async query(params: QueryParams): Promise<CompletionResponse> {
    if (this.debug) {
      console.debug('[Runtime Debug] Processing query:', {
        query: params.query,
        hasActions: !!params.actions,
        hasState: !!params.state,
        params
      });
    }

    const intentResponse = await this.processIntent(params);

    const messages: Message[] = [
      { role: 'system', content: generatePrompt(intentResponse.intent, params) },
      { role: 'user', content: params.query }
    ];

    if (this.debug) {
      console.debug('[Runtime Debug] Action request:', {
        intent: intentResponse.intent,
        messages
      });
    }

    const response = await this.provider.createCompletion(messages);
    if (!response || !('message' in response)) {
      throw new Error('Invalid response format');
    }

    return {
      message: response.message,
      action: 'action' in response ? response.action : null,
      reasoning: response.reasoning || [],
      intent: intentResponse.intent
    };
  }
}

export function createRuntime(config: RuntimeConfig): RuntimeBase {
  return new RuntimeImpl(config);
}

export type {
  RuntimeBase as Runtime,
  RuntimeConfig,
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  QueryParams,
};

export { BaseLLMProvider };
export type LLMProvider = BaseLLMProvider;

export { BaseAdapter } from './adapter';