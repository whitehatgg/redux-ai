import { BaseAdapter, type RuntimeAdapterConfig } from '@redux-ai/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export class NextjsAdapter extends BaseAdapter {
  public createHandler(config: RuntimeAdapterConfig) {
    const runtime = config.runtime;
    const endpoint = config.endpoint ?? '/api/query';

    const handler = async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        // Rate limit check first before endpoint validation
        if (this.isRateLimited(req)) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            status: 'error',
          });
        }

        // Then check endpoint
        if (req.url !== endpoint) {
          return res.status(404).json({ error: 'Not found' });
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
        // Handle specific error types with appropriate status codes
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();

          // API key related errors
          if (errorMessage.includes('api key') || errorMessage.includes('apikey')) {
            return res.status(401).json({
              error: 'Invalid or missing API key',
              status: 'error',
            });
          }
        }

        // Default to 500 for unknown errors
        return res.status(500).json({
          error: 'Unknown error',
          status: 'error',
        });
      }
    };

    return handler.bind(this);
  }

  private isRateLimited(_req: NextApiRequest): boolean {
    // Rate limiting logic to be implemented
    return false;
  }
}

export default NextjsAdapter;
