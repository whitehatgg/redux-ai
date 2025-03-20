import type { Middleware, UnknownAction } from '@reduxjs/toolkit';

interface WorkflowMiddlewareOptions {
  sideEffectTypes?: string[];
  sideEffectTimeout?: number;
  debug?: boolean;
}

class WorkflowMiddleware {
  private sideEffectTypes: Set<string>;
  private readonly timeout: number;
  private readonly debug: boolean;

  constructor(options: WorkflowMiddlewareOptions = {}) {
    this.sideEffectTypes = new Set(options.sideEffectTypes || []);
    this.timeout = options.sideEffectTimeout || 5000;
    this.debug = options.debug || false;
  }

  createMiddleware(): Middleware {
    return () => next => action => {
      if (!action || typeof action !== 'object' || !('type' in action)) {
        return next(action);
      }

      const typedAction = action as UnknownAction;

      if (!this.sideEffectTypes.has(typedAction.type)) {
        return next(typedAction);
      }

      const result = next(typedAction);

      if (!result || typeof result.then !== 'function') {
        return result;
      }

      return Promise.race([
        result,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Side effect timeout after ${this.timeout}ms`));
          }, this.timeout);
        })
      ]);
    };
  }
}

export const createWorkflowMiddleware = (options?: WorkflowMiddlewareOptions): Middleware => {
  const middleware = new WorkflowMiddleware(options);
  return middleware.createMiddleware();
};