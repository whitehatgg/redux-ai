export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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

export interface QueryParams {
  query: string;
  prompt?: string;
  actions?: unknown[];
  currentState?: Record<string, unknown>;
}

export interface RuntimeAdapter {
  createHandler(config: { runtime: Runtime; endpoint?: string }): unknown;
}

export interface Runtime {
  readonly provider: LLMProvider;
  readonly messages: Message[];
  readonly currentState?: Record<string, unknown>;
  readonly debug: boolean;
  query(params: QueryParams): Promise<CompletionResponse>;
}
