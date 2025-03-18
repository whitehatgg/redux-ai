import { configureStore } from '@reduxjs/toolkit';
import { createWorkflowMiddleware } from '@redux-ai/state';

import type { ApplicantState } from './schema';
import applicantReducer from './slices/applicantSlice';

// Create the workflow middleware
const workflowMiddleware = createWorkflowMiddleware({
  debug: process.env.NODE_ENV !== 'production'
});

// Use schema's inferred type for store
export type RootState = {
  applicant: ApplicantState;
};
export type AppDispatch = typeof store.dispatch;

// Create the store with workflow middleware
export const store = configureStore({
  reducer: {
    applicant: applicantReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware()
      .concat(workflowMiddleware)
});