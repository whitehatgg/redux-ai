import type { BaseLLMProvider } from './provider';

export interface CompletionResponse {
  message: string;
  action: Record<string, unknown> | null;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  timeout?: number;
  debug?: boolean;
}

export interface QueryParams {
  query: string;
  state?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  conversations?: string;
}

export interface RuntimeAdapter {
  createHandler(config: { runtime: Runtime; endpoint?: string }): unknown;
}

export interface Runtime {
  readonly debug: boolean;
  query(params: QueryParams): Promise<CompletionResponse>;
}

// Re-export types used by providers
export type { BaseLLMProvider as LLMProvider };
