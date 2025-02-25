import { createServer } from 'http';
import { ExpressAdapter } from '@redux-ai/express';
import type { Express } from 'express';
import { runtime } from './config';

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = adapter.createHandler({ runtime });

  // Register API endpoint with detailed logging
  app.post('/api/query', async (req, res) => {
    console.log('[API Request]:', {
      body: req.body,
      url: req.url,
      method: req.method
    });

    // Create a wrapper to capture the response
    const wrappedRes = {
      ...res,
      json: (data: any) => {
        console.log('[API Response Data]:', JSON.stringify(data, null, 2));
        return res.json(data);
      }
    };

    try {
      // Forward to handler with enhanced logging
      await handler(req, wrappedRes, () => {
        console.log('[API Handler Complete]');
      });
    } catch (error) {
      console.error('[API Error]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}