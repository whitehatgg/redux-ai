import { Middleware } from '@reduxjs/toolkit';

export const actionTrackingMiddleware: Middleware = store => next => action => {
  // Add trigger source information to the action
  const actionWithSource = {
    ...action,
    __source: action.__source || 'ui' // Default to 'ui' if not specified
  };

  // Store the action for tracking
  (store as any).lastAction = actionWithSource;

  return next(actionWithSource);
};