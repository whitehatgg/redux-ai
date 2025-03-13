import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterResponse, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export class NextjsAdapter extends BaseAdapter {
  public async createHandler(config: RuntimeAdapterConfig): Promise<AdapterResponse> {
    const runtime = config.runtime;
    const path = config.endpoint ?? '/api/ai';
    const self = this;

    return async function handler(req: NextApiRequest, res: NextApiResponse) {
      // Only accept POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({
          status: 'error',
          error: 'Method not allowed'
        });
      }

      // Verify endpoint path
      if (req.url !== path) {
        return res.status(404).json({
          status: 'error',
          error: 'Not found'
        });
      }

      try {
        const { query, state, actions } = req.body;

        // Process request through runtime
        const response = await runtime.query({
          query,
          state,
          actions
        });

        return res.json(response);
      } catch (error) {
        const errorResult = self.handleError(error);
        return res.status(errorResult.status).json(errorResult.body);
      }
    };
  }
}

export default NextjsAdapter;