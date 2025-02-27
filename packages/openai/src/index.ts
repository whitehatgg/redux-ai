import { BaseLLMProvider, type Message, type ProviderConfig } from '@redux-ai/runtime/src/provider';
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
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1000;
  }

  protected convertMessage(message: Message): ChatCompletionMessage {
    return {
      role: 'assistant',
      content: message.content,
      refusal: null,
    };
  }

  protected async completeRaw(messages: Message[]): Promise<unknown> {
    if (this.debug) {
      console.debug('[OpenAI] Converting messages:', messages);
    }

    const openAIMessages = messages.map(msg => this.convertMessage(msg));

    if (this.debug) {
      console.debug('[OpenAI] Sending request with messages:', openAIMessages);
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: { type: 'json_object' },
    });

    if (!response.choices[0].message.content) {
      throw new Error('Empty response from OpenAI');
    }

    const content = response.choices[0].message.content;
    if (this.debug) {
      console.debug('[OpenAI] Received response:', content);
    }

    return content;
  }
}
