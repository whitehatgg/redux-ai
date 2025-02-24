import { createServer } from 'http';
import { ExpressAdapter } from '@redux-ai/express';
import type { Express, NextFunction, Request, Response } from 'express';

import { runtime } from './config';

// Create a logger utility
const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[AI API]', ...args);
    }
  },
};

// Middleware for checking OpenAI configuration
function checkAIConfig(req: Request, res: Response, next: NextFunction) {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI features are currently disabled. Please configure your OpenAI API key.',
      isConfigured: false,
    });
  }
  next();
}

// Request logging middleware
function logAIRequest(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { query, prompt, actions, currentState } = req.body;

  logger.info('Request:', {
    rawQuery: query,
    promptLength: prompt?.length,
    actionsCount: actions?.length,
    actionTypes: actions?.map((a: { type: string }) => a.type),
    hasState: !!currentState,
    stateKeys: currentState ? Object.keys(currentState) : [],
  });

  // Capture and log response
  const originalJson = res.json;
  res.json = function (body) {
    logger.info('Response:', {
      message: body.message,
      hasAction: !!body.action,
      action: body.action,
    });
    return originalJson.call(res, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request completed in ${duration}ms`);
  });

  next();
}

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = adapter.createHandler({ runtime });

  // Apply middleware chain for /api/query endpoint
  app.post(
    '/api/query',
    checkAIConfig,    // First check API configuration
    logAIRequest,     // Log the request
    handler           // Finally, handle the request
  );

  const httpServer = createServer(app);
  return httpServer;
}