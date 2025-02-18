import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState } from '@redux-ai/state';
import { createReduxAIVector } from '@redux-ai/vector';
import demoReducer from './slices/demoSlice';

// Create the Redux store with the demo reducer
export const store = configureStore({
  reducer: {
    demo: demoReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
});

let _reduxAI: Awaited<ReturnType<typeof createReduxAIState>> | null = null;

export const initializeReduxAI = async () => {
  if (_reduxAI) return _reduxAI;

  try {
    console.log('Initializing ReduxAI...');

    // First create the vector storage
    const vectorStorage = await createReduxAIVector({
      collectionName: 'interactions'
    });
    console.log('Vector storage initialized');

    // Then create the ReduxAI state manager
    _reduxAI = await createReduxAIState({
      store,
      vectorStorage,
      onError: (error) => {
        console.error('ReduxAI Error:', error);
      }
    });

    // Log initial state after ReduxAI initialization
    console.log('Initial Redux State:', store.getState());

    // Subscribe to store changes
    store.subscribe(() => {
      const state = store.getState();
      console.log('Redux State Updated:', state);
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