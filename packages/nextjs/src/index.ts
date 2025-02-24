import { BaseAdapter, type RuntimeAdapterConfig } from '@redux-ai/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export class NextjsAdapter extends BaseAdapter {
  public createHandler(config: RuntimeAdapterConfig) {
    const runtime = config.runtime;
    const endpoint = config.endpoint ?? '/api/query';

    const handler = async (req: NextApiRequest, res: NextApiResponse) => {
      // Only process requests matching the configured endpoint
      if (req.url !== endpoint) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        const { query, prompt, actions, currentState } = req.body;
        const response = await runtime.query({ query, prompt, actions, currentState });
        res.json(response);
      } catch (error) {
        const errorResponse = this.handleError(error);
        res.status(errorResponse.status).json(errorResponse.body);
      }
    };

    return handler.bind(this);
  }
}

export default NextjsAdapter;