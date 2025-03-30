import type { BaseLLMProvider } from './provider';

export interface CompletionResponse {
  message: string;
  action: Record<string, unknown> | null;
  reasoning: string | string[];
  intent: 'action' | 'state' | 'conversation' | 'pipeline';
  pipeline?: CompletionResponse[];
  steps?: Array<{ query: string }>;
}

export interface IntentCompletionResponse {
  intent: 'action' | 'state' | 'conversation' | 'pipeline';
  message: string;
  reasoning: string | string[];
  action: Record<string, unknown> | null;
  pipeline?: CompletionResponse[];
  steps?: Array<{ query: string }>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  timeout?: number;
}

export interface QueryParams {
  query: string;
  state?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  conversations?: string;
}

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

// Define handler type for clarity
export type AdapterHandler = (req: unknown, res: unknown, next?: unknown) => Promise<void>;

// Updated to directly return handler function
export type AdapterResponse = AdapterHandler;

export interface RuntimeAdapter {
  createHandler(config: RuntimeAdapterConfig): Promise<AdapterResponse>;
  handleError(error: unknown): {
    status: number;
    body: { error: string; status: string };
  };
}

export interface RuntimeBase {
  query(params: QueryParams): Promise<CompletionResponse>;
}

export interface RuntimeConfig {
  provider: BaseLLMProvider;
}

export interface RuntimeAdapterConfig {
  runtime: RuntimeBase;
  endpoint?: string;
}

export type { BaseLLMProvider };
