import { Middleware } from '@reduxjs/toolkit';

export const actionTrackingMiddleware: Middleware = () => next => action => {
  // Add trigger source information to the action
  const actionWithSource = {
    ...action,
    __source: action.__source || 'ui' // Default to 'ui' if not specified
  };
  return next(actionWithSource);
};