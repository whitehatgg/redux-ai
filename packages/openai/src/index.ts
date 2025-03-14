import { BaseLLMProvider } from '@redux-ai/runtime';
import type { CompletionResponse, Message } from '@redux-ai/runtime/dist/types';
import OpenAI from 'openai';

export interface OpenAIConfig {
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
    super();
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1000;
  }

  protected convertMessage(message: Message) {
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
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content || '{}';
    return JSON.parse(content.trim());
  }
}

export default OpenAIProvider;