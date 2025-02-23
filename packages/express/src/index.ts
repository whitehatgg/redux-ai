import type { HandlerConfig, Runtime, RuntimeAdapter } from '@redux-ai/runtime';
import type { NextFunction, Request, Response } from 'express';
import {
  validateQuery,
  handleAIErrors,
  checkAIConfig,
  logAIRequest,
  createAIQueryHandler,
} from './middleware';

export {
  validateQuery,
  handleAIErrors,
  checkAIConfig,
  logAIRequest,
  createAIQueryHandler,
};

export function createHandler(config: HandlerConfig) {
  const path = config.endpoint ?? '/api/query';
  const runtime = config.runtime;

  return async function runtimeHandler(req: Request, res: Response, next: NextFunction) {
    if (req.path !== path || req.method !== 'POST') {
      return next();
    }

    const handler = createAIQueryHandler(runtime);

    // Apply middleware chain
    return Promise.resolve()
      .then(() => checkAIConfig(req, res, next))
      .then(() => validateQuery(req, res, next))
      .then(() => logAIRequest(req, res, next))
      .then(() => handler(req, res, next))
      .catch(error => handleAIErrors(error, req, res, next));
  };
}

export class ExpressAdapter implements RuntimeAdapter {
  createHandler(config: HandlerConfig) {
    return createHandler(config);
  }
}