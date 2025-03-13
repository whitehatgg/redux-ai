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
      // First determine intent
      const messages: Message[] = [
        { role: 'system', content: generatePrompt('intent', params) },
        { role: 'user', content: params.query }
      ];

      const response = await this.provider.createCompletion(messages);

      // For conversation intent, include full context
      if (!response.action && (!response.intent || response.intent === 'conversation')) {
        const conversationMessages: Message[] = [
          { role: 'system', content: generatePrompt('conversation', params) },
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

      // For workflow intent, handle multi-step processing
      if (response.intent === 'workflow' || 
          params.query.toLowerCase().includes(' and then ')) {
        const workflowMessages: Message[] = [
          { role: 'system', content: generatePrompt('workflow', params) },
          { role: 'user', content: params.query }
        ];

        const workflowResponse = await this.provider.createCompletion(workflowMessages);

        // Process workflow steps
        if (!workflowResponse?.steps || !Array.isArray(workflowResponse.steps)) {
          throw new Error('Invalid workflow step splitting response');
        }

        return {
          message: workflowResponse.message || response.message,
          action: null,
          reasoning: workflowResponse.reasoning || response.reasoning || [],
          intent: 'workflow',
          workflow: workflowResponse.steps.map(step => ({
            message: step.message,
            intent: step.intent,
            action: step.action,
            reasoning: step.reasoning
          }))
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