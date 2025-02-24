/* eslint-disable @typescript-eslint/consistent-type-imports */
import { configureStore } from '@reduxjs/toolkit';
import { s } from 'ajv-ts';
import { storeSchema } from './schema';
import applicantReducer from './slices/applicantSlice';

// Use schema's inferred type for store
export type StoreSchema = s.infer<typeof storeSchema>;

// Create the store with proper type annotations
export const store = configureStore({
  reducer: {
    applicant: applicantReducer as any, // Temporary type assertion to fix build
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;