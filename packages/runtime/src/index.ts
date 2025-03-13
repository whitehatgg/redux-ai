import { generatePrompt } from './prompts';
import { BaseLLMProvider } from './provider';
import type {
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  QueryParams,
  RuntimeBase,
  RuntimeConfig
} from './types';

export class RuntimeImpl implements RuntimeBase {
  private provider: BaseLLMProvider;
  public readonly debug: boolean;

  constructor(config: RuntimeConfig) {
    this.provider = config.provider;
    this.debug = config.debug ?? false;
  }

  async query(params: QueryParams): Promise<CompletionResponse> {
    try {
      // First determine if this might be a multi-step workflow
      const messages: Message[] = [
        { role: 'system', content: generatePrompt('intent', params) },
        { role: 'user', content: params.query }
      ];

      const response = await this.provider.createCompletion(messages);

      // For conversation intent, include full context
      if (!response.action && (!response.intent || response.intent === 'conversation')) {
        // Pass through the full context for conversation prompts
        const conversationMessages: Message[] = [
          { role: 'system', content: generatePrompt('conversation', {
            query: params.query,
            state: params.state,
            actions: params.actions,
            conversations: params.conversations
          })},
          { role: 'user', content: params.query }
        ];

        const conversationResponse = await this.provider.createCompletion(conversationMessages);
        return {
          message: conversationResponse.message,
          action: null,
          reasoning: conversationResponse.reasoning || [],
          intent: 'conversation'
        };
      }

      // Handle workflow processing for multi-step queries
      if (response.message?.toLowerCase().includes(' and ') || 
          params.query.toLowerCase().includes(' and ')) {
        const workflowSteps = await this.splitWorkflowSteps(params.query, params);

        const processedSteps = await Promise.all(
          workflowSteps.map(async (step) => {
            const stepResponse = await this.query({
              ...params,
              query: step.query
            });

            return {
              message: stepResponse.message,
              intent: stepResponse.intent,
              action: stepResponse.action,
              reasoning: Array.isArray(stepResponse.reasoning) ? 
                stepResponse.reasoning : [stepResponse.reasoning]
            };
          })
        );

        return {
          message: response.message,
          action: null,
          reasoning: response.reasoning || [],
          intent: 'workflow',
          workflow: processedSteps
        };
      }

      // For single-step actions/state queries
      const actionMessages: Message[] = [
        { role: 'system', content: generatePrompt(response.intent || 'state', params) },
        { role: 'user', content: params.query }
      ];

      const actionResponse = await this.provider.createCompletion(actionMessages);

      return {
        message: actionResponse.message,
        action: actionResponse.action,
        reasoning: actionResponse.reasoning || [],
        intent: response.intent || 'state'
      };
    } catch (error) {
      throw error;
    }
  }

  private async splitWorkflowSteps(query: string, params: QueryParams): Promise<Array<{ query: string }>> {
    const messages: Message[] = [
      { 
        role: 'system', 
        content: generatePrompt('workflow', { 
          ...params,
          query 
        })
      },
      { role: 'user', content: query }
    ];

    const response = await this.provider.createCompletion(messages);

    if (!response?.message || !Array.isArray(response.steps)) {
      throw new Error('Invalid workflow step splitting response');
    }

    return response.steps;
  }

}

export function createRuntime(config: RuntimeConfig): RuntimeBase {
  return new RuntimeImpl(config);
}

export type {
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  QueryParams,
  RuntimeBase,
};

export { BaseLLMProvider };
export { BaseAdapter } from './adapter';