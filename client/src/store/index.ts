import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState } from '@redux-ai/state';
import { createReduxAIVector } from '@redux-ai/vector';
import { schema } from './schema';
import demoReducer from './slices/demoSlice';

// Initialize store first
export const store = configureStore({
  reducer: {
    demo: demoReducer
  }
});

let _reduxAI: ReturnType<typeof createReduxAIState> | null = null;

export const initializeReduxAI = async () => {
  if (_reduxAI) return _reduxAI;

  const vectorStorage = await createReduxAIVector({
    collectionName: 'interactions'
  });

  _reduxAI = createReduxAIState({
    store,
    schema,
    vectorStorage,
    onError: (error) => {
      console.error('ReduxAI Error:', error);
    }
  });

  return _reduxAI;
};

// Initialize immediately
initializeReduxAI().catch(console.error);

// Export a function to get the initialized instance
export const getReduxAI = () => {
  if (!_reduxAI) {
    throw new Error('ReduxAI not initialized');
  }
  return _reduxAI;
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;