import type { CompletionResponse, LLMProvider, Message } from '@redux-ai/runtime';
import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 200;
  }

  async complete(
    messages: Message[],
    _currentState?: Record<string, unknown>
  ): Promise<CompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: { type: 'json_object' },
    });

    if (!response.choices[0].message.content) {
      throw new Error('Invalid response format from AI');
    }

    const content = JSON.parse(response.choices[0].message.content);

    if (!content.message) {
      throw new Error('Invalid response format: missing message');
    }

    return {
      message: content.message,
      action: content.action || null,
    };
  }
}
