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
      const prompt = `${DEFAULT_PROMPTS.intent}${JSON_FORMAT_MESSAGE}\n\nQuery: ${params.query}\nActions: ${JSON.stringify(params.actions)}\nState: ${JSON.stringify(params.state)}\nContext: ${params.conversations}`;

      if (this.debug) {
        console.debug('[Runtime Debug] Sending intent prompt:', prompt);
      }

      const response = (await this.provider.complete(prompt)) as IntentCompletionResponse;

      if (this.debug) {
        console.debug('[Runtime Debug] Raw intent response:', JSON.stringify(response, null, 2));
      }

      // Validate basic intent response format
      if (
        !response ||
        !response.intent ||
        !['action', 'state', 'conversation'].includes(response.intent)
      ) {
        throw new Error('Invalid intent response');
      }

      return {
        intent: response.intent,
        message: response.message || '',
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Intent Processing:', error);
      }
      if (error instanceof Error && error.message.includes('Provider error')) {
        throw error;
      }
      throw new Error('Invalid intent response');
    }
  }

  private async processAction(params: {
    query: string;
    actions: Record<string, unknown>;
    state: Record<string, unknown>;
    conversations: string;
  }): Promise<CompletionResponse> {
    try {
      const prompt = `${DEFAULT_PROMPTS.action}${JSON_FORMAT_MESSAGE}\n\nQuery: ${
        params.query
      }\nActions: ${JSON.stringify(params.actions, null, 2)}\nState: ${JSON.stringify(
        params.state,
        null,
        2
      )}\nContext: ${params.conversations}`;

      if (this.debug) {
        console.debug('[Runtime Debug] Sending action prompt:', prompt);
      }

      const response = (await this.provider.complete(prompt)) as CompletionResponse;

      if (this.debug) {
        console.debug('[Runtime Debug] Raw action response:', JSON.stringify(response, null, 2));
      }

      // Validate response format
      if (!response || !response.message) {
        throw new Error('Invalid action response');
      }

      // Validate action if present
      if (response.action) {
        if (!response.action.type || typeof response.action.type !== 'string') {
          throw new Error('Invalid action response');
        }

        return {
          message: response.message,
          action: {
            type: response.action.type,
            ...(response.action.payload !== undefined && { payload: response.action.payload }),
          },
        };
      }

      return {
        message: response.message,
        action: null,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Action Processing:', error);
      }
      if (error instanceof Error && error.message.includes('Provider error')) {
        throw error;
      }
      throw new Error('Invalid action response');
    }
  }

  private async processState(params: {
    query: string;
    state: Record<string, unknown>;
    conversations: string;
  }): Promise<CompletionResponse> {
    try {
      const prompt = `${DEFAULT_PROMPTS.state}${JSON_FORMAT_MESSAGE}\n\nQuery: ${
        params.query
      }\nState: ${JSON.stringify(params.state, null, 2)}\nContext: ${params.conversations}`;

      if (this.debug) {
        console.debug('[Runtime Debug] Sending state prompt:', prompt);
      }

      const response = (await this.provider.complete(prompt)) as CompletionResponse;

      if (this.debug) {
        console.debug('[Runtime Debug] Raw state response:', JSON.stringify(response, null, 2));
      }

      // Validate response format
      if (!response || !response.message) {
        throw new Error('Invalid state response');
      }

      return {
        message: response.message,
        action: null,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] State Processing:', error);
      }
      if (error instanceof Error && error.message.includes('Provider error')) {
        throw error;
      }
      throw new Error('Invalid state response');
    }
  }

  private async processConversation(params: {
    query: string;
    conversations: string;
    actions?: Record<string, unknown>;
  }): Promise<CompletionResponse> {
    try {
      // Include both past conversations and available actions in the context
      const prompt = `${DEFAULT_PROMPTS.conversation}${JSON_FORMAT_MESSAGE}\n\nQuery: ${
        params.query
      }\nActions: ${JSON.stringify(params.actions)}\nContext: ${
        params.conversations || 'No previous conversation history.'
      }`;

      if (this.debug) {
        console.debug('[Runtime Debug] Raw conversation prompt:', prompt);
      }

      const response = (await this.provider.complete(prompt)) as CompletionResponse;

      if (this.debug) {
        console.debug(
          '[Runtime Debug] Raw conversation response:',
          JSON.stringify(response, null, 2)
        );
      }

      // Validate response format
      if (!response || !response.message) {
        throw new Error('Invalid conversation response');
      }

      return {
        message: response.message,
        action: null,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Runtime Error] Conversation Processing:', error);
      }
      if (error instanceof Error && error.message.includes('Provider error')) {
        throw error;
      }
      throw new Error('Invalid conversation response');
    }
  }

  async query(params: QueryParams): Promise<CompletionResponse | IntentCompletionResponse> {
    const { query, state, actions, conversations = '' } = params;

    try {
      if (this.debug) {
        console.debug('[Runtime Debug] Starting query processing:', {
          query,
          hasState: !!state,
          hasActions: !!actions,
          hasConversations: !!conversations,
          availableActions: actions ? Object.keys(actions) : [],
        });
      }

      // First determine intent
      const intentResponse = await this.processIntent({
        query,
        conversations,
        actions,
        state,
      });

      if (this.debug) {
        console.debug('[Runtime Debug] Determined intent:', intentResponse);
      }

      // Process based on intent and check resource availability
      switch (intentResponse.intent) {
        case 'action': {
          if (!actions) {
            throw new Error('No actions available for action intent');
          }
          const actionResponse = await this.processAction({ query, actions, state: state || {}, conversations });
          return {
            ...actionResponse,
            intent: intentResponse.intent,
          };
        }
        case 'state': {
          if (!state) {
            throw new Error('No state available for state intent');
          }
          const stateResponse = await this.processState({ query, state, conversations });
          return {
            ...stateResponse,
            intent: intentResponse.intent,
          };
        }
        case 'conversation':
        default: {
          const conversationResponse = await this.processConversation({ query, conversations, actions });
          return {
            ...conversationResponse,
            intent: intentResponse.intent,
          };
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

// Factory function to create runtime instances
export function createRuntime(config: RuntimeConfig): RuntimeBase {
  return new RuntimeImpl(config);
}

// Export types and interfaces
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

// Export core provider class
export { BaseLLMProvider };
export type LLMProvider = BaseLLMProvider;

// Export adapter related types
export { BaseAdapter } from './adapter';