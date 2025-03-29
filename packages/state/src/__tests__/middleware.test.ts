import { configureStore, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createEffectTracker, markAsEffect } from '../middleware';
import { vi, describe, test, expect, beforeEach } from 'vitest';

describe('Effect Tracker Middleware', () => {
  // Create an async thunk
  const incrementAsync = createAsyncThunk(
    'counter/incrementAsync',
    async (amount: number) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return amount;
    }
  );
  
  // Create a simple counter slice
  const counterSlice = createSlice({
    name: 'counter',
    initialState: { value: 0 },
    reducers: {
      increment: (state) => {
        state.value += 1;
      },
      incrementBy: (state, action: PayloadAction<number>) => {
        state.value += action.payload;
      },
      sagaStart: (state) => {
        // Just a marker action, doesn't modify state
      },
      sagaEnd: (state) => {
        // Just a marker action, doesn't modify state
      }
    },
    extraReducers: (builder) => {
      builder.addCase(
        incrementAsync.fulfilled, 
        (state, action: PayloadAction<number>) => {
          state.value += action.payload;
        }
      );
    }
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
  let effectTracker: ReturnType<typeof createEffectTracker>;
  
  beforeEach(() => {
    // Create the effect tracker with debug enabled
    effectTracker = createEffectTracker({ 
      debug: true,
      timeout: 2000 // Short timeout for testing
    });
    
    // Create a store with the middleware
    store = configureStore({
      reducer: {
        counter: counterSlice.reducer,
      },
      middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(effectTracker.middleware),
    }) as any; // Type assertion to avoid TypeScript errors
  });
  
  // Tests for various middleware capabilities
  test('middleware handles different types of async effects', async () => {
    // Test 1: Regular RTK Query/Thunk
    // Dispatch an async thunk that should be tracked
    (store.dispatch as any)(incrementAsync(5));
    
    // Wait for effects to complete
    await effectTracker.waitForEffects();
    
    // State should be updated by the fulfilled action handler
    expect((store.getState() as RootState).counter.value).toBe(5);
    
    // Test 2: Marked Effects with markAsEffect helper
    // Create a promise
    const customPromise = new Promise<void>(resolve => {
      setTimeout(() => {
        // This will happen after the promise resolves
        store.dispatch(counterSlice.actions.incrementBy(3));
        resolve();
      }, 50);
    });
    
    // Use markAsEffect to attach a promise to an action
    store.dispatch(markAsEffect(counterSlice.actions.increment(), { promise: customPromise }));
    
    // Wait for all effects to complete
    await effectTracker.waitForEffects();
    
    // Value should be incremented twice - once immediately from increment()
    // and once from the incrementBy(3) after the promise resolves
    expect((store.getState() as RootState).counter.value).toBe(9);
  });
  
  test('middleware tracks saga-style start/end patterns', async () => {
    // Generate a unique ID for this "saga"
    const sagaId = `saga-counter/increment-${Date.now()}`;
    
    // Dispatch the start action with isStart flag
    store.dispatch(
      markAsEffect(counterSlice.actions.sagaStart(), {
        effectId: sagaId,
        isStart: true
      })
    );
    
    // Simulate some async work happening in a saga
    setTimeout(() => {
      // In a real saga, this would happen as part of the saga flow
      store.dispatch(counterSlice.actions.incrementBy(10));
      
      // Dispatch the end action with isEnd flag and same ID
      store.dispatch(
        markAsEffect(counterSlice.actions.sagaEnd(), {
          effectId: sagaId,
          isEnd: true
        })
      );
    }, 100);
    
    // Wait for the "saga" to complete
    await effectTracker.waitForEffects();
    
    // Verify the action in the saga was processed
    expect((store.getState() as RootState).counter.value).toBe(10);
  });
  
  test('middleware with direct promise syntax (backwards compatibility)', async () => {
    const promise = new Promise<void>(resolve => {
      setTimeout(() => {
        store.dispatch(counterSlice.actions.incrementBy(7));
        resolve();
      }, 50);
    });
    
    // Use the promise directly as second arg
    store.dispatch(markAsEffect(counterSlice.actions.increment(), promise));
    
    await effectTracker.waitForEffects();
    
    expect((store.getState() as RootState).counter.value).toBe(8); // 1 + 7
  });
});