import { BaseAdapter, type RuntimeAdapterConfig } from '@redux-ai/runtime';
import type { NextFunction, Request, Response } from 'express';

/**
 * Express adapter for Redux AI runtime
 */
export class ExpressAdapter extends BaseAdapter {
  public createHandler(config: RuntimeAdapterConfig) {
    const runtime = config.runtime;
    const path = config.endpoint ?? '/api/query';

    const handler = async (req: Request, res: Response, next: NextFunction) => {
      if (req.path !== path || req.method !== 'POST') {
        return next();
      }

      try {
        if (runtime.debug) {
          console.log('[Express Debug] Incoming request body:', req.body);
        }

        const { query, state, actions, conversations } = req.body;
        const response = await runtime.query({
          query,
          state,
          actions,
          conversations,
        });

        if (runtime.debug) {
          console.log('[Express Debug] Response:', response);
        }

        return res.json(response);
      } catch (error) {
        if (runtime.debug) {
          console.error('[Express Debug] Error processing request:', error);
        }

        // Handle specific error types
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();

          // API key related errors
          if (
            errorMessage.includes('api key') ||
            errorMessage.includes('apikey') ||
            errorMessage.includes('authentication')
          ) {
            return res.status(401).json({
              error: 'Invalid or missing API key',
              status: 'error',
            });
          }

          // Rate limit errors
          if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
            return res.status(429).json({
              error: 'Rate limit exceeded',
              status: 'error',
            });
          }
        }

        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
        });
      }
    };

    return handler.bind(this);
  }
}

export default ExpressAdapter;
