import { BaseLLMProvider } from '@redux-ai/runtime';
import type { CompletionResponse, Message } from '@redux-ai/runtime/dist/types';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  debug?: boolean;
}

interface WorkflowStep {
  message: string;
  intent: 'action' | 'state' | 'conversation';
  reasoning: string[];
  action: Record<string, unknown> | null;
}

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  protected debug: boolean;

  constructor(config: OpenAIConfig) {
    super();
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'gpt-4';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1000;
    this.debug = config.debug ?? false;
  }

  protected convertMessage(message: Message): ChatCompletionMessageParam {
    return {
      role: message.role === 'system' ? 'system' : message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    };
  }

  protected async completeRaw(messages: Message[]): Promise<CompletionResponse> {
    return this.createCompletion(messages);
  }

  async createCompletion(messages: Message[]): Promise<CompletionResponse> {
    const openAIMessages = messages.map(msg => this.convertMessage(msg));

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: openAIMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        return {
          message: "I'm not sure how to help with that. Could you provide more details?",
          action: null,
          reasoning: ['Empty response received'],
          intent: 'conversation',
        };
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content.trim());
      } catch (error) {
        return {
          message: "I couldn't process that properly. Could you try rephrasing?",
          action: null,
          reasoning: ['Invalid JSON format'],
          intent: 'conversation',
        };
      }

      // Basic validation of response format
      if (!parsedResponse?.message || typeof parsedResponse.message !== 'string') {
        return {
          message: "I couldn't understand that. Could you try rephrasing?",
          action: null,
          reasoning: ['Invalid response format - missing message'],
          intent: 'conversation',
        };
      }

      // For workflow step responses, validate steps array
      if (parsedResponse.steps && !Array.isArray(parsedResponse.steps)) {
        return {
          message: "I couldn't process that workflow. Could you try rephrasing?",
          action: null,
          reasoning: ['Invalid workflow steps format'],
          intent: 'conversation',
        };
      }

      return {
        message: parsedResponse.message,
        action: parsedResponse.action || null,
        reasoning: Array.isArray(parsedResponse.reasoning)
          ? parsedResponse.reasoning
          : ['Processing response'],
        intent: parsedResponse.intent || 'conversation',
        steps: parsedResponse.steps,
        workflow: parsedResponse.workflow,
      };
    } catch (error) {
      return {
        message: "I'm having trouble processing that. Could you try again?",
        action: null,
        reasoning: ['API request failed', error instanceof Error ? error.message : 'Unknown error'],
        intent: 'conversation',
      };
    }
  }
}

export default OpenAIProvider;