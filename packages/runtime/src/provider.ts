import type { Message } from './types';

export interface CompletionResponse {
  message: string;
  action: Record<string, unknown> | null;
}

export interface LLMProvider {
  complete(
    messages: Message[],
    currentState?: Record<string, unknown>
  ): Promise<CompletionResponse>;
}
