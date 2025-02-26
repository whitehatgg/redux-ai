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
        const { query, prompt } = req.body;
        const response = await runtime.query({ query, prompt });
        return res.json(response);
      } catch (error) {
        const errorResponse = this.handleError(error);
        return res.status(errorResponse.status).json(errorResponse.body);
      }
    };

    return handler.bind(this);
  }
}

export default ExpressAdapter;