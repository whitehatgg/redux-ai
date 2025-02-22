import type { HandlerConfig as ReduxAIHandlerConfig, RuntimeAdapter } from '@redux-ai/runtime';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface NextjsHandlerConfig extends ReduxAIHandlerConfig {}

export function createHandler(config: NextjsHandlerConfig) {
  const runtime = config.runtime;

  return async function runtimeHandler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { query, prompt, actions, currentState } = req.body;
      const response = await runtime.query({ query, prompt, actions, currentState });
      res.json(response);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return res.status(401).json({
            error: 'Invalid or missing API key. Please check your configuration.',
            isConfigured: false,
          });
        }
        if (error.message.includes('does not have access to model')) {
          return res.status(403).json({
            error: 'Your API key does not have access to the required model.',
            isConfigured: false,
          });
        }
        if (error.message.includes('rate limit')) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.',
          });
        }
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };
}

export class NextjsAdapter implements RuntimeAdapter {
  createHandler(config: ReduxAIHandlerConfig): ReturnType<typeof createHandler> {
    return createHandler(config);
  }
}

export default NextjsAdapter;
