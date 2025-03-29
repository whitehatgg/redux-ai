import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIMiddleware } from '@redux-ai/state';

import type { ApplicantState } from './schema';
import applicantReducer from './slices/applicantSlice';

// Create the effect tracker middleware
export const effectTracker = createReduxAIMiddleware({ 
  debug: true,
  timeout: 30000, // 30 seconds timeout for effects
  onEffectsCompleted: () => console.log('[EffectTracker] All effects completed, ready for next workflow step')
});

// Use schema's inferred type for store
export type RootState = {
  applicant: ApplicantState;
};
export type AppDispatch = typeof store.dispatch;

// Create the store with effect tracker middleware
export const store = configureStore({
  reducer: {
    applicant: applicantReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(effectTracker.middleware),
});
