import { ExpressAdapter } from '@redux-ai/express';
import type { Express } from 'express';

import { runtime } from './config';

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = adapter.createHandler({ runtime });

  app.post('/api/query', async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  return app;
}
