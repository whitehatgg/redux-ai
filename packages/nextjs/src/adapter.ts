import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterResponse, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export class NextjsAdapter extends BaseAdapter {
  public async createHandler(config: RuntimeAdapterConfig): Promise<AdapterResponse> {
    const runtime = config.runtime;
    const path = config.endpoint ?? '/api/query';

    const handler = async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'POST') {
        return res.status(405).json({
          error: 'Method not allowed',
          status: 'error',
          isConfigured: false,
        });
      }

      try {
        // Rate limit check first before endpoint validation
        if (this.isRateLimited(req)) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            status: 'error',
            isConfigured: false,
          });
        }

        // Then check endpoint
        if (req.url !== path) {
          return res.status(404).json({
            error: 'Not found',
            status: 'error',
            isConfigured: false,
          });
        }

        const { query, state, actions, conversations } = req.body;

        const response = await runtime.query({
          query,
          state,
          actions,
          conversations,
        });

        return res.json(response);
      } catch (error) {
        const errorResult = this.handleError(error);
        return res.status(errorResult.status).json(errorResult.body);
      }
    };

    // Cast the handler function as AdapterResponse to satisfy the interface
    return handler as unknown as AdapterResponse;
  }

  private isRateLimited(_req: NextApiRequest): boolean {
    // Rate limiting logic to be implemented
    return false;
  }

  public handleError(error: unknown): {
    status: number;
    body: { error: string; status: string; isConfigured: boolean };
  } {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // API key related errors
      if (errorMessage.includes('api key') || errorMessage.includes('apikey')) {
        return {
          status: 401,
          body: {
            error: 'Invalid or missing API key',
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
    }

    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        isConfigured: false,
      },
    };
  }
}

export default NextjsAdapter;
