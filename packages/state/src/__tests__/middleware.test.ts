import {
  configureStore,
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createReduxAIMiddleware } from '../middleware';

describe('Redux AI Middleware', () => {
  // Create an async thunk
  const incrementAsync = createAsyncThunk('counter/incrementAsync', async (amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return amount;
  });

  // Create a simple counter slice
  const counterSlice = createSlice({
    name: 'counter',
    initialState: { value: 0 },
    reducers: {
      increment: state => {
        state.value += 1;
      },
      incrementBy: (state, action: PayloadAction<number>) => {
        state.value += action.payload;
      },
      asyncIncrement: state => {
        // Just a marker action for async operation pattern
      },
      asyncIncrementComplete: state => {
        // Just a marker action for async operation pattern
      },
      reset: state => {
        state.value = 0;
      },
    },
    extraReducers: builder => {
      builder.addCase(incrementAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.value += action.payload;
      });
    },
  });

  // Set a longer timeout for async tests
  vi.setConfig({ testTimeout: 10000 });

  // Define a type for the RootState
  interface RootState {
    counter: {
      value: number;
    };
  }

  let store: ReturnType<typeof configureStore>;
  let effectTracker: ReturnType<typeof createReduxAIMiddleware>;

  beforeEach(() => {
    // Create the Redux AI middleware with debug enabled
    effectTracker = createReduxAIMiddleware({
      debug: true,
      timeout: 2000, // Short timeout for testing
    });

    // Create a store with the middleware
    store = configureStore({
      reducer: {
        counter: counterSlice.reducer,
      },
      middleware: getDefaultMiddleware => getDefaultMiddleware().concat(effectTracker.middleware),
    }) as any; // Type assertion to avoid TypeScript errors
  });

  // Tests for various middleware capabilities
  test('middleware automatically tracks RTK async thunks', async () => {
    // Dispatch an async thunk that should be tracked automatically
    (store.dispatch as any)(incrementAsync(5));

    // Wait for effects to complete
    await effectTracker.waitForEffects();

    // State should be updated by the fulfilled action handler
    expect((store.getState() as RootState).counter.value).toBe(5);
  });

  test('middleware automatically tracks conventional async patterns', async () => {
    // Reset side effect tracking between tests
    effectTracker.resetSideEffectInfo();

    // First, ensure the counter is at 0
    expect((store.getState() as RootState).counter.value).toBe(0);

    // Dispatch a start action that follows common async pattern naming
    store.dispatch({
      type: 'counter/asyncOperation/pending',
      meta: { operationId: 'test-operation' },
    });

    // Use a promise to ensure proper test synchronization
    await new Promise<void>(resolve => {
      // Simulate async work
      setTimeout(() => {
        // In a real app, this would be a side effect
        store.dispatch(counterSlice.actions.incrementBy(10));

        // Dispatch the completion action using common pattern naming
        store.dispatch({
          type: 'counter/asyncOperation/fulfilled',
          meta: { operationId: 'test-operation' },
        });

        resolve();
      }, 100);
    });

    // Wait for the operations to complete
    await effectTracker.waitForEffects();

    // Verify the action was processed
    expect((store.getState() as RootState).counter.value).toBe(10);
  });

  test('middleware handles multiple simultaneous async operations', async () => {
    // Reset counters and side effects before this test
    effectTracker.resetSideEffectInfo();

    // Reset counter state
    store.dispatch({ type: 'counter/reset' });

    // Ensure clean starting state
    expect((store.getState() as RootState).counter.value).toBe(0);

    // Dispatch multiple async operations simultaneously
    (store.dispatch as any)(incrementAsync(3));
    (store.dispatch as any)(incrementAsync(7));

    // Wait for all effects to complete
    await effectTracker.waitForEffects();

    // Verify both operations completed (3 + 7 = 10)
    expect((store.getState() as RootState).counter.value).toBe(10);
  });
});
