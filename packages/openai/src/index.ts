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
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1000;
  }

  async complete(
    messages: Message[],
    currentState?: Record<string, unknown>
  ): Promise<CompletionResponse> {
    // Format system message with current state if available
    const systemMessages = currentState
      ? [{
          role: 'system',
          content: `Current state: ${JSON.stringify(currentState, null, 2)}`
        }]
      : [];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [...systemMessages, ...messages],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      if (!parsed.message) {
        throw new Error('Response missing message property');
      }

      return {
        message: String(parsed.message),
        action: parsed.action || null
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`OpenAI API error: ${message}`);
    }
  }
}