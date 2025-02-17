import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState } from '@redux-ai/state';
import { schema } from './schema';
import demoReducer from './slices/demoSlice';

// Create store with demo reducer
export const store = configureStore({
  reducer: {
    demo: demoReducer
  }
});

// Expose current state to window for AI access
declare global {
  interface Window {
    __REDUX_STATE__: ReturnType<typeof store.getState>;
  }
}

store.subscribe(() => {
  window.__REDUX_STATE__ = store.getState();
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