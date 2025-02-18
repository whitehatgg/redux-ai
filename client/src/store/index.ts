import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState } from '@redux-ai/state';
import { createReduxAIVector } from '@redux-ai/vector';
import demoReducer from './slices/demoSlice';

export const store = configureStore({
  reducer: {
    demo: demoReducer
  }
});

let _reduxAI: Awaited<ReturnType<typeof createReduxAIState>> | null = null;

export const initializeReduxAI = async () => {
  if (_reduxAI) return _reduxAI;

  try {
    const vectorStorage = await createReduxAIVector({
      collectionName: 'interactions'
    });

    _reduxAI = await createReduxAIState({
      store,
      vectorStorage,
      onError: (error) => {
        console.error('ReduxAI Error:', error);
      }
    });

    return _reduxAI;
  } catch (error) {
    console.error('Failed to initialize ReduxAI:', error);
    throw error;
  }
};

export const getReduxAI = () => {
  if (!_reduxAI) {
    throw new Error('ReduxAI not initialized');
  }
  return _reduxAI;
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;