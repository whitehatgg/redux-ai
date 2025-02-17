import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState } from '@redux-ai/state';
import { schema } from './schema';

// Create an empty initial state
const initialState = {};

// Create a store with a simple reducer that just returns the state
export const store = configureStore({
  reducer: (state = initialState, action) => state
});

// Create ReduxAI state manager with schema validation
export const reduxAI = createReduxAIState({
  store,
  schema,
  onError: (error) => {
    console.error('ReduxAI Error:', error);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;