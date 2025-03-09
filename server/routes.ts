import { ExpressAdapter } from '@redux-ai/express';
import type { Express } from 'express';

import { runtime } from './config';

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = await adapter.createHandler({ runtime });

  app.post('/api/query', async (req, res, next) => {
    try {
      // Add detailed debug logging
      console.log('[Debug] Request body:', JSON.stringify(req.body, null, 2));

      // Cast the handler back to its original type for execution
      await (handler as unknown as (req: any, res: any, next: any) => Promise<void>)(
        req,
        res,
        next
      );
    } catch (error) {
      // Log the full error details
      console.error('[Debug] Error in /api/query:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  });

  return app;
}