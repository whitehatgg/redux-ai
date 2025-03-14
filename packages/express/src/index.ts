import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterHandler, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { Request, Response } from 'express';

/**
 * Express adapter for Redux AI runtime
 */
export class ExpressAdapter extends BaseAdapter {
  public async createHandler(config: RuntimeAdapterConfig): Promise<AdapterHandler> {
    const runtime = config.runtime;
    const path = config.endpoint ?? '/api/query';

    return (async function handler(request: Request) {
      const req = request as any;
      const res = req.res as Response;

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      if (req.path !== path) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const response = await runtime.query(req.body);
      res.json(response);

    }) as unknown as AdapterHandler;
  }
}

export default ExpressAdapter;