import { configureStore } from '@reduxjs/toolkit';

import type { ApplicantState } from './schema';
import applicantReducer from './slices/applicantSlice';

// Use schema's inferred type for store
export type RootState = {
  applicant: ApplicantState;
};
export type AppDispatch = typeof store.dispatch;

// Create the store
export const store = configureStore({
  reducer: {
    applicant: applicantReducer,
  },
});
