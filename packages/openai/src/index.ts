import { BaseLLMProvider } from '@redux-ai/runtime';
import type { CompletionResponse, Message, ProviderConfig } from '@redux-ai/runtime/dist/types';
import OpenAI from 'openai';
import type { ChatCompletionMessage } from 'openai/resources/chat/completions';

export interface OpenAIConfig extends ProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: OpenAIConfig) {
    super({
      timeout: config.timeout,
      debug: config.debug,
    });
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1000;
  }

  protected convertMessage(message: Message): ChatCompletionMessage {
    return {
      role: message.role,
      content: message.content,
    } as ChatCompletionMessage;
  }

  protected async completeRaw(messages: Message[]): Promise<unknown> {
    const openAIMessages = messages.map(msg => this.convertMessage(msg));

    if (this.debug) {
      console.debug('[OpenAI] Request context:', {
        messages: openAIMessages,
        actionsInContext: openAIMessages.some(msg => 
          msg.content && msg.content.includes('Available actions:')
        )
      });
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    if (this.debug) {
      console.debug('[OpenAI] Raw response:', content);
    }

    return JSON.parse(content);
  }
}

export default OpenAIProvider;