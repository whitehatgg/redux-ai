import type { BaseLLMProvider } from './provider';

export interface CompletionResponse {
  message: string;
  action: Record<string, unknown> | null;
  reasoning: string | string[];
}

export interface IntentCompletionResponse {
  intent: 'action' | 'state' | 'conversation';
  message: string;
  reasoning: string | string[];
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

// Runtime adapter related types
export interface AdapterRequestBody {
  query: string;
  prompt?: string;
  actions?: unknown[];
  currentState?: Record<string, unknown>;
}

export interface AdapterRequest {
  runtime: RuntimeBase;
  endpoint?: string;
  body: AdapterRequestBody;
  method: string;
}

export interface AdapterResponse {
  handler: unknown;
  status(code: number): AdapterResponse;
  json(data: unknown): void;
}

export interface RuntimeAdapter {
  createHandler(config: RuntimeAdapterConfig): Promise<AdapterResponse>;
  handleError(error: unknown): {
    status: number;
    body: { error: string; status: string };
  };
}

// Base interface for Runtime implementation
export interface RuntimeBase {
  readonly debug: boolean;
  query(params: QueryParams): Promise<CompletionResponse & { reasoning: string[]; intent: string }>;
}

// Configuration for creating a runtime instance
export interface RuntimeConfig {
  provider: BaseLLMProvider;
  debug?: boolean;
}

// Configuration for runtime adapters
export interface RuntimeAdapterConfig {
  runtime: RuntimeBase;
  endpoint?: string;
  debug?: boolean;
}

export type { BaseLLMProvider };