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
    const self = this;

    async function handler(req: Request, res: Response, next: NextFunction) {
      if (req.path !== path || req.method !== 'POST') {
        return next();
      }

      try {
        const { query, state, actions, conversations } = req.body;
        const response = await runtime.query({
          query,
          state,
          actions,
          conversations,
        });

        return res.json(response);
      } catch (error) {
        const errorResult = self.handleError(error);
        return res.status(errorResult.status).json(errorResult.body);
      }
    }

    return handler;
  }
}

export default ExpressAdapter;