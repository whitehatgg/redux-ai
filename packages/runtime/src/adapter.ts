import type { Runtime } from './types';

export interface AdapterRequest {
  body: {
    query: string;
    prompt?: string;
    actions?: unknown[];
    currentState?: Record<string, unknown>;
  };
  method: string;
}

export interface AdapterResponse {
  status(code: number): AdapterResponse;
  json(data: unknown): void;
}

export interface RuntimeAdapterConfig {
  runtime: Runtime;
  endpoint?: string;
  debug?: boolean;
}

export interface RuntimeAdapter {
  /**
   * Create a request handler for the given framework (Express, Next.js, etc.)
   */
  createHandler(config: RuntimeAdapterConfig): unknown;

  /**
   * Handle API errors in a consistent way across adapters
   */
  handleError(error: unknown): {
    status: number;
    body: {
      error: string;
      isConfigured?: boolean;
    };
  };
}

export abstract class BaseAdapter implements RuntimeAdapter {
  public handleError(error: unknown): { status: number; body: { error: string; isConfigured?: boolean } } {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          status: 401,
          body: {
            error: 'Invalid or missing API key. Please check your configuration.',
            isConfigured: false,
          },
        };
      }
      if (error.message.includes('does not have access to model')) {
        return {
          status: 403,
          body: {
            error: 'Your API key does not have access to the required model.',
            isConfigured: false,
          },
        };
      }
      if (error.message.includes('rate limit')) {
        return {
          status: 429,
          body: {
            error: 'Rate limit exceeded. Please try again later.',
          },
        };
      }
      return {
        status: 500,
        body: {
          error: error.message,
        },
      };
    }
    return {
      status: 500,
      body: {
        error: 'An unknown error occurred',
      },
    };
  }

  abstract createHandler(config: RuntimeAdapterConfig): unknown;
}

// Re-export the Runtime type to ensure consumers get the complete interface
export type { Runtime } from './types';