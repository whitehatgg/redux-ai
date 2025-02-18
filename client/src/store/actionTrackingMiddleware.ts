import { Middleware } from '@reduxjs/toolkit';

// Extending Window interface to store the last action
declare global {
  interface Window {
    __LAST_ACTION__: any;
  }
}

export const actionTrackingMiddleware: Middleware = () => next => action => {
  // Store the action globally so ReduxAIProvider can access it
  if (typeof window !== 'undefined') {
    // Add trigger source information to the action
    const actionWithSource = {
      ...action,
      __source: action.__source || 'ui' // Default to 'ui' if not specified
    };
    window.__LAST_ACTION__ = actionWithSource;
  }
  return next(action);
};