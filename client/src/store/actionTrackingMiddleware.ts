import { Middleware } from '@reduxjs/toolkit';

export const actionTrackingMiddleware: Middleware = store => next => action => {
  if (!action || typeof action !== 'object') {
    console.warn('Invalid action in middleware:', action);
    return next(action);
  }

  const actionWithTimestamp = {
    ...action,
    timestamp: new Date().toISOString()
  };

  // Store the action for tracking
  (store as any).lastAction = actionWithTimestamp;

  console.log('Action tracked in middleware:', actionWithTimestamp);

  return next(actionWithTimestamp);
};