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
    window.__LAST_ACTION__ = action;
  }
  return next(action);
};
