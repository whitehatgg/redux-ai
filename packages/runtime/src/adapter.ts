import type {
  AdapterRequest as AdapterRequestType,
  AdapterResponse as AdapterResponseType,
  RuntimeAdapter,
  RuntimeAdapterConfig,
  RuntimeBase,
} from './types';

export abstract class BaseAdapter implements RuntimeAdapter {
  public handleError(error: unknown): {
    status: number;
    body: { error: string; status: string; isConfigured: boolean };
  } {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // API key related errors
      if (
        errorMessage.includes('api key') ||
        errorMessage.includes('apikey') ||
        errorMessage.includes('authentication')
      ) {
        return {
          status: 401,
          body: {
            error: 'Invalid or missing API key',
            status: 'error',
            isConfigured: false,
          },
        };
      }

      // Authorization errors
      if (errorMessage.includes('does not have access to model')) {
        return {
          status: 403,
          body: {
            error: 'Your API key does not have access',
            status: 'error',
            isConfigured: false,
          },
        };
      }

      // Rate limit errors
      if (errorMessage.includes('rate limit')) {
        return {
          status: 429,
          body: {
            error: 'Rate limit exceeded',
            status: 'error',
            isConfigured: false,
          },
        };
      }

      // Check for provider errors first
      if (errorMessage === 'provider error') {
        return {
          status: 500,
          body: {
            error: 'Runtime error',
            status: 'error',
            isConfigured: false,
          },
        };
      }

      // All other errors
      return {
        status: 500,
        body: {
          error: error.message || 'Unknown error',
          status: 'error',
          isConfigured: false,
        },
      };
    }

    return {
      status: 500,
      body: {
        error: 'Unknown error',
        status: 'error',
        isConfigured: false,
      },
    };
  }

  abstract createHandler(config: RuntimeAdapterConfig): Promise<AdapterResponseType>;
}

// Re-export types
export type {
  RuntimeAdapter,
  RuntimeAdapterConfig,
  AdapterRequestType as AdapterRequest,
  AdapterResponseType as AdapterResponse,
};
