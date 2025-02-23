import type { HandlerConfig, RuntimeAdapter } from '@redux-ai/runtime';
import type { NextFunction, Request, Response } from 'express';

import { checkAIConfig, createAIQueryHandler, logAIRequest, validateQuery } from './middleware';

export { validateQuery, checkAIConfig, logAIRequest, createAIQueryHandler };

export function createHandler(config: HandlerConfig) {
  const path = config.endpoint ?? '/api/query';
  const runtime = config.runtime;

  return async function runtimeHandler(req: Request, res: Response, next: NextFunction) {
    if (req.path !== path || req.method !== 'POST') {
      return next();
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
        return res.status(500).json({
          error: error.message,
        });
      }
      // For non-Error objects, return a generic 500 error
      res.status(500).json({
        error: 'An unknown error occurred',
      });
    }
  };
}

export class ExpressAdapter implements RuntimeAdapter {
  createHandler(config: HandlerConfig) {
    return createHandler(config);
  }
}
