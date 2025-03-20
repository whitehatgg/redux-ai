import type { Middleware } from '@reduxjs/toolkit';

export const createWorkflowMiddleware = (): Middleware => {
  return () => next => action => {
    return next(action);
  };
};