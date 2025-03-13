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
    const self = this;

    async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: req.method + ' not allowed' });
      }

      try {
        // Then check endpoint
        if (req.url !== path) {
          return res.status(404).json({ error: 'Not found: ' + req.url });
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
        const errorResult = self.handleError(error);
        return res.status(errorResult.status).json(errorResult.body);
      }
    }

    return handler;
  }
}

export default NextjsAdapter;