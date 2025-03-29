import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { createReduxAIMiddleware } from '@redux-ai/state';

import applicantReducer from './slices/applicantSlice';

// Create the effect tracker middleware
export const effectTracker = createReduxAIMiddleware({ 
  debug: true,
  timeout: 30000, // 30 seconds timeout for effects
  onEffectsCompleted: () => console.log('[EffectTracker] All effects completed, ready for next workflow step')
});

const makeStore = () =>
  configureStore({
    reducer: {
      applicant: applicantReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(effectTracker.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

// Types for store
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<AppStore>(makeStore);
