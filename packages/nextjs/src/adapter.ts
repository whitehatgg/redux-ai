import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterHandler, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export class NextjsAdapter extends BaseAdapter {
  public async createHandler(config: RuntimeAdapterConfig): Promise<AdapterHandler> {
    const runtime = config.runtime;
    const path = config.endpoint ?? '/api/ai';
    const self = this;

    return (async function handler(request: NextApiRequest, response: NextApiResponse) {
      // Only accept POST requests
      if (request.method !== 'POST') {
        response.status(405).json({
          status: 'error',
          error: 'Method not allowed'
        });
        return;
      }

      // Verify endpoint path
      if (request.url !== path) {
        response.status(404).json({
          status: 'error',
          error: 'Not found'
        });
        return;
      }

      try {
        const { query, state, actions } = request.body;

        // Process request through runtime
        const result = await runtime.query({
          query,
          state,
          actions
        });

        response.json(result);
      } catch (error) {
        const errorResult = self.handleError(error);
        response.status(errorResult.status).json(errorResult.body);
      }
    }) as unknown as AdapterHandler;
  }
}

export default NextjsAdapter;