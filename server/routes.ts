import { ExpressAdapter } from '@redux-ai/express';
import type { Express } from 'express';

import { runtime } from './config';

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = await adapter.createHandler({ runtime });

  app.post('/api/query', async (req, res, next) => {
    try {
      // Cast the handler back to its original type for execution
      await (handler as unknown as (req: any, res: any, next: any) => Promise<void>)(
        req,
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  });

  return app;
}
