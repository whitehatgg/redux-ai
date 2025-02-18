import { configureStore } from '@reduxjs/toolkit';
import applicantReducer, { type ApplicantState } from './slices/applicantSlice';
import { actionTrackingMiddleware } from './actionTrackingMiddleware';

export interface RootState {
  applicant: ApplicantState;
}

// Custom middleware to validate actions
const actionValidationMiddleware = () => (next: any) => (action: any) => {
  if (!action || typeof action !== 'object' || !('type' in action)) {
    console.warn('Invalid action:', action);
    return next({ type: 'INVALID_ACTION' });
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    applicant: applicantReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in actions
        ignoredActionPaths: ['__source'],
        // Ignore these field paths in the state
        ignoredPaths: ['lastAction']
      },
    }).concat([actionValidationMiddleware, actionTrackingMiddleware])
});

export type AppDispatch = typeof store.dispatch;