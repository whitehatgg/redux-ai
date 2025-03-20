import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { createWorkflowMiddleware } from '../middleware';

describe('Basic Integration', () => {
  it('should work like the README example', () => {
    const store = configureStore({
      reducer: (state = {}, action) => {
        if (action.type === 'UPDATE_USER') {
          return { ...state, user: action.payload };
        }
        return state;
      },
      middleware: (getDefault) => getDefault().concat(createWorkflowMiddleware())
    });

    // Dispatch action
    const userData = { status: 'active' };
    store.dispatch({ type: 'UPDATE_USER', payload: userData });

    // Verify state update
    expect(store.getState().user).toEqual(userData);
  });
});