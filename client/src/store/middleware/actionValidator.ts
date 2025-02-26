import type { Middleware } from '@reduxjs/toolkit';
import { validateAction } from '@redux-ai/schema';
import type { BaseAction } from '@redux-ai/schema';
import { storeSchema } from '../schema';

export const actionValidatorMiddleware: Middleware = store => next => action => {
  // Skip validation for internal Redux actions and error actions
  if (typeof action !== 'object' || !action || action.type.startsWith('@@redux/') || action.type.startsWith('error/')) {
    return next(action);
  }

  // Validate the action against our schema
  const validationResult = validateAction(action, storeSchema);

  if (!validationResult.valid) {
    console.error('Action validation failed:', validationResult.errors);
    // Dispatch an error action with validation details
    return store.dispatch({
      type: 'error/actionValidation',
      payload: {
        originalAction: action,
        errors: validationResult.errors,
      },
    });
  }

  // If validation passes, let the action through with the validated value
  return next(validationResult.value as BaseAction);
};