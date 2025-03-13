import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterResponse, RuntimeAdapterConfig, AdapterHandler } from '@redux-ai/runtime/dist/types';
import type { NextFunction, Request, Response } from 'express';

/**
 * Express adapter for Redux AI runtime
 */
export class ExpressAdapter extends BaseAdapter {
  public async createHandler(config: RuntimeAdapterConfig): Promise<AdapterHandler> {
    const runtime = config.runtime;
    const path = config.endpoint ?? '/api/query';
    const self = this;

    return (async (request: unknown) => {
      const req = request as any;
      const res = req.res as Response;

      if (req.method !== 'POST') {
        res.status(405).json({
          status: 'error',
          error: 'Method not allowed'
        });
        return;
      }

      if (req.path !== path) {
        res.status(404).json({
          status: 'error',
          error: 'Not found'
        });
        return;
      }

      try {
        const { query, state, actions } = req.body;
        const response = await runtime.query({
          query,
          state,
          actions
        });

        res.json(response);
      } catch (error) {
        const errorResult = self.handleError(error);
        res.status(errorResult.status).json(errorResult.body);
      }
    }) as AdapterHandler;
  }
}

export default ExpressAdapter;