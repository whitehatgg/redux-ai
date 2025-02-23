import { createServer } from 'http';
import {
  checkAIConfig,
  createAIQueryHandler,
  handleAIErrors,
  logAIRequest,
  validateQuery,
} from '@redux-ai/express';
import type { Express } from 'express';

import { runtime } from './config';

export async function registerRoutes(app: Express) {
  // Apply middleware chain for /api/query endpoint
  app.post(
    '/api/query',
    checkAIConfig,
    validateQuery,
    logAIRequest,
    createAIQueryHandler(runtime),
    handleAIErrors
  );

  const httpServer = createServer(app);
  return httpServer;
}
