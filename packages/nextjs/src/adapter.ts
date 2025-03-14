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

    return (async function handler(request: NextApiRequest, response: NextApiResponse) {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      if (request.url !== path) {
        response.status(404).json({ error: 'Not found' });
        return;
      }

      const result = await runtime.query(request.body);
      response.json(result);
    }) as unknown as AdapterHandler;
  }
}

export default NextjsAdapter;