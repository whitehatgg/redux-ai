import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterResponse, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { NextFunction, Request, Response } from 'express';

/**
 * Express adapter for Redux AI runtime
 */
export class ExpressAdapter extends BaseAdapter {
  public async createHandler(config: RuntimeAdapterConfig): Promise<AdapterResponse> {
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

        const errorResult = this.handleError(error);
        return res.status(errorResult.status).json(errorResult.body);
      }
    };

    // Cast the handler function as AdapterResponse to satisfy the interface
    return handler as unknown as AdapterResponse;
  }
}

export default ExpressAdapter;
