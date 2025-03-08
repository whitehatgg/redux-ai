import { DEFAULT_PROMPTS, JSON_FORMAT_MESSAGE } from './prompts';
import { BaseLLMProvider } from './provider';
import type {
  AdapterRequest,
  AdapterResponse,
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  ProviderConfig,
  QueryParams,
  RuntimeAdapter,
  RuntimeBase,
  RuntimeConfig,
} from './types';

// Runtime implementation
export class RuntimeImpl implements RuntimeBase {
  private provider: BaseLLMProvider;
  public readonly debug: boolean;

  constructor(config: RuntimeConfig) {
    this.provider = config.provider;
    this.debug = config.debug ?? false;
  }

  private async processIntent(params: {
    query: string;
    conversations: string;
    actions?: Record<string, unknown>;
    state?: Record<string, unknown>;
  }): Promise<IntentCompletionResponse> {
    try {
      const contextStr = [
        params.actions ? `Available actions: ${JSON.stringify(params.actions)}` : null,
        params.state ? `Current state: ${JSON.stringify(params.state)}` : null,
        params.conversations ? `Previous interactions: ${params.conversations}` : null,
      ].filter(Boolean).join('\n');

      const messages: Message[] = [
        { role: 'system', content: DEFAULT_PROMPTS.intent + JSON_FORMAT_MESSAGE },
        { role: 'user', content: `Query: "${params.query}"\n${contextStr}` }
      ];

      if (this.debug) {
        console.debug('[Runtime Debug] Intent analysis messages:', messages);
      }

      const response = await this.provider.createCompletion(messages);

      if (this.debug) {
        console.debug('[Runtime Debug] Raw intent response:', JSON.stringify(response, null, 2));
      }

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid intent response format');
      }

      if (!('intent' in response) || !('message' in response) || !('reasoning' in response)) {
        throw new Error('Intent response missing required fields');
      }

      const intent = response.intent;
      if (!['action', 'state', 'conversation'].includes(intent)) {
        throw new Error('Invalid intent value');
      }

      return {
        intent,
        message: response.message,
        reasoning: response.reasoning
      };

    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Debug] Intent analysis failed:', error);
      }
      throw new Error(`Failed to analyze query intent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async query(params: QueryParams): Promise<CompletionResponse> {
    const { query, state, actions, conversations = '' } = params;

    try {
      if (this.debug) {
        console.debug('[Runtime Debug] Processing query:', {
          query,
          hasState: !!state,
          hasActions: !!actions,
          hasConversations: !!conversations,
        });
      }

      const intentResponse = await this.processIntent({
        query,
        conversations,
        actions,
        state,
      });

      const contextStr = [
        actions ? `Available actions: ${JSON.stringify(actions)}` : null,
        state ? `Current state: ${JSON.stringify(state)}` : null,
        conversations ? `Previous interactions: ${conversations}` : null,
      ].filter(Boolean).join('\n');

      const responseType = intentResponse.intent === 'action' ? 'action' :
                        intentResponse.intent === 'state' ? 'state' : 'conversation';

      const messages: Message[] = [
        { role: 'system', content: DEFAULT_PROMPTS[responseType] + JSON_FORMAT_MESSAGE },
        { role: 'user', content: `Query: "${query}"\n${contextStr}` }
      ];

      if (this.debug) {
        console.debug('[Runtime Debug] Response generation messages:', messages);
      }

      const response = await this.provider.createCompletion(messages);

      if (this.debug) {
        console.debug('[Runtime Debug] Final response:', JSON.stringify(response, null, 2));
      }

      if (!response || !response.message) {
        throw new Error('Invalid response format');
      }

      return {
        message: response.message,
        action: 'action' in response ? response.action : null,
        reasoning: response.reasoning
      };

    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Debug] Query processing failed:', error);
      }
      throw new Error(`Query processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function createRuntime(config: RuntimeConfig): RuntimeBase {
  return new RuntimeImpl(config);
}

export type {
  RuntimeBase as Runtime,
  RuntimeConfig,
  RuntimeAdapter,
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  ProviderConfig,
  QueryParams,
  AdapterRequest,
  AdapterResponse,
};

export { BaseLLMProvider };
export type LLMProvider = BaseLLMProvider;

export { BaseAdapter } from './adapter';