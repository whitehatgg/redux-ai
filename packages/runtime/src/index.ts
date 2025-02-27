import { DEFAULT_PROMPTS, JSON_FORMAT_MESSAGE } from './prompts';
import {
  BaseLLMProvider,
  type CompletionResponse,
  type Message,
  type ProviderConfig,
} from './provider';
import type { QueryParams } from './types';

export interface RuntimeConfig {
  provider: BaseLLMProvider;
  debug?: boolean;
}

interface IntentResponse {
  intent: 'action' | 'state' | 'conversation';
  message: string;
}

interface ActionResponse extends CompletionResponse {
  message: string;
  action: Record<string, unknown>;
}

interface StateResponse extends CompletionResponse {
  message: string;
  action: null;
}

interface ConversationResponse extends CompletionResponse {
  message: string;
  action: null;
}

export class Runtime {
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
  }): Promise<IntentResponse> {
    try {
      const prompt = `${DEFAULT_PROMPTS.intent}${JSON_FORMAT_MESSAGE}\n\nQuery: ${params.query}\nActions: ${JSON.stringify(params.actions)}\nContext: ${params.conversations}`;
      const response = await this.provider.complete(prompt);

      const parsed = response.action as { intent: 'action' | 'state' | 'conversation' };
      if (!parsed?.intent || !['action', 'state', 'conversation'].includes(parsed.intent)) {
        throw new Error('Invalid intent response: missing intent field');
      }

      return {
        intent: parsed.intent,
        message: response.message,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Intent Processing:', error);
      }
      throw error;
    }
  }

  private async processAction(params: {
    query: string;
    actions: Record<string, unknown>;
    state: Record<string, unknown>;
    conversations: string;
  }): Promise<ActionResponse> {
    try {
      const prompt = `${DEFAULT_PROMPTS.action}${JSON_FORMAT_MESSAGE}
Available Actions:
${JSON.stringify(params.actions, null, 2)}

Query: ${params.query}
State: ${JSON.stringify(params.state, null, 2)}
Context: ${params.conversations}`;

      const response = await this.provider.complete(prompt);

      // Only validate basic structure
      if (!response.action || typeof response.action !== 'object') {
        throw new Error('Invalid action response: missing or invalid action object');
      }

      const action = response.action as Record<string, unknown>;
      if (!action.type || typeof action.type !== 'string') {
        throw new Error('Invalid action response: missing action type');
      }

      // Return the action without additional validation
      return {
        message: response.message,
        action: action,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Action Processing:', error);
      }
      throw error;
    }
  }

  private async processState(params: {
    query: string;
    state: Record<string, unknown>;
    conversations: string;
  }): Promise<StateResponse> {
    try {
      const prompt = `${DEFAULT_PROMPTS.state}${JSON_FORMAT_MESSAGE}\n\nQuery: ${params.query}\nState: ${JSON.stringify(params.state, null, 2)}\nContext: ${params.conversations}`;
      const response = await this.provider.complete(prompt);

      if (!response || !response.message) {
        throw new Error('Invalid state response: missing message');
      }

      return {
        message: response.message,
        action: null,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] State Processing:', error);
      }
      throw error;
    }
  }

  private async processConversation(params: {
    query: string;
    conversations: string;
    actions?: Record<string, unknown>;
  }): Promise<ConversationResponse> {
    try {
      const prompt = `${DEFAULT_PROMPTS.conversation}${JSON_FORMAT_MESSAGE}\n\nQuery: ${params.query}\nActions: ${JSON.stringify(params.actions)}\nContext: ${params.conversations}`;
      const response = await this.provider.complete(prompt);

      if (!response || !response.message) {
        throw new Error('Invalid conversation response: missing message');
      }

      return {
        message: response.message,
        action: null,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Conversation Processing:', error);
      }
      throw error;
    }
  }

  async query(params: QueryParams): Promise<CompletionResponse> {
    const { query, state, actions, conversations = '' } = params;

    try {
      const intentResponse = await this.processIntent({
        query,
        conversations,
        actions,
      });

      switch (intentResponse.intent) {
        case 'action': {
          if (!actions) {
            throw new Error('No actions available for action intent');
          }
          return this.processAction({ query, actions, state: state || {}, conversations });
        }
        case 'state': {
          if (!state) {
            throw new Error('No state available for state intent');
          }
          return this.processState({ query, state, conversations });
        }
        case 'conversation':
        default: {
          // Pass actions to conversation mode
          return this.processConversation({ query, conversations, actions });
        }
      }
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Query Processing:', error);
      }
      throw error;
    }
  }
}

export function createRuntime(config: RuntimeConfig): Runtime {
  return new Runtime(config);
}

// Re-export types used by providers
export type { CompletionResponse, Message, ProviderConfig };
export { BaseLLMProvider };
export type LLMProvider = BaseLLMProvider;

export {
  BaseAdapter,
  type RuntimeAdapter,
  type RuntimeAdapterConfig,
  type AdapterRequest,
  type AdapterResponse,
} from './adapter';
