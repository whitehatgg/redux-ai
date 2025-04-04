import { generatePrompt } from './prompts';
import { BaseLLMProvider } from './provider';
import { completionResponseSchema } from './schema';
import type { CompletionResponse, Message, QueryParams, RuntimeBase, RuntimeConfig } from './types';

interface PipelineStep {
  intent: string;
  message: string;
  reasoning?: string | string[];
  action?: Record<string, unknown> | null;
}

export class RuntimeImpl implements RuntimeBase {
  private provider: BaseLLMProvider;

  constructor(config: RuntimeConfig) {
    this.provider = config.provider;
  }

  private async processIntent(query: string, params: QueryParams): Promise<CompletionResponse> {
    // Get intent first
    const intentMessages: Message[] = [
      { role: 'system', content: generatePrompt('intent', params) },
      { role: 'user', content: query },
    ];

    const intentResponse = await this.provider.createCompletion(intentMessages);
    const intent = completionResponseSchema.parse(intentResponse).intent;

    if (intent === 'pipeline') {
      const pipelineMessages: Message[] = [
        { role: 'system', content: generatePrompt('pipeline', params) },
        { role: 'user', content: query },
      ];

      const pipelineResponse = await this.provider.createCompletion(pipelineMessages);

      if (pipelineResponse.pipeline && Array.isArray(pipelineResponse.pipeline)) {
        // Execute each pipeline step
        const processedSteps: CompletionResponse[] = [];
        for (const step of pipelineResponse.pipeline) {
          // Ensure step.intent is one of the valid prompt types
          const validPromptTypes = ['intent', 'action', 'state', 'conversation', 'pipeline'];
          const promptType = validPromptTypes.includes(step.intent) ? step.intent : 'conversation';

          const stepMessages: Message[] = [
            {
              role: 'system',
              content: generatePrompt(
                promptType as 'intent' | 'action' | 'state' | 'conversation' | 'pipeline',
                params
              ),
            },
            { role: 'user', content: step.message },
          ];
          const stepResponse = await this.provider.createCompletion(stepMessages);
          processedSteps.push({
            intent: step.intent,
            message: stepResponse.message,
            reasoning: stepResponse.reasoning,
            action: stepResponse.action,
          });
        }

        return {
          ...pipelineResponse,
          pipeline: processedSteps,
        };
      }

      return pipelineResponse;
    }

    // For non-pipeline requests
    const messages: Message[] = [
      { role: 'system', content: generatePrompt(intent, params) },
      { role: 'user', content: query },
    ];

    const response = await this.provider.createCompletion(messages);
    return {
      ...response,
      intent,
    };
  }

  async query(params: QueryParams): Promise<CompletionResponse> {
    return this.processIntent(params.query, params);
  }
}

export function createRuntime(config: RuntimeConfig): RuntimeBase {
  return new RuntimeImpl(config);
}

export type { CompletionResponse, Message, QueryParams, RuntimeBase };
export { BaseLLMProvider };
export { BaseAdapter } from './adapter';
