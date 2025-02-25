import { configureStore } from '@reduxjs/toolkit';
import type { BaseAction } from '@redux-ai/schema';
import { storeSchema } from './schema';
import applicantReducer from './slices/applicantSlice';

// Use schema's inferred type for store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Create the store with proper type annotations
export const store = configureStore({
  reducer: {
    applicant: applicantReducer,
  },
});