import type {
  AdapterRequest as AdapterRequestType,
  AdapterResponse as AdapterResponseType,
  RuntimeAdapter,
  RuntimeAdapterConfig,
} from './types';

export abstract class BaseAdapter implements RuntimeAdapter {
  public handleError(error: unknown): {
    status: number;
    body: { error: string; status: string };
  } {
    // Pass through the original error message
    return {
      status: error instanceof Error ? 
        // Use standard HTTP status codes but let original error propagate
        (error.message.toLowerCase().includes('api key') ? 401 :
         error.message.toLowerCase().includes('rate limit') ? 429 : 500) : 500,
      body: {
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      }
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