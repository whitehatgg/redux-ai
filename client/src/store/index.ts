import { configureStore, Middleware } from '@reduxjs/toolkit';
import applicantReducer, { type ApplicantState } from './slices/applicantSlice';

export interface RootState {
  applicant: ApplicantState;
}

// Custom middleware to track current action
const actionTrackingMiddleware: Middleware = store => next => action => {
  (store as any)._currentAction = action;
  const result = next(action);
  (store as any)._currentAction = null;
  return result;
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
    }).concat([actionTrackingMiddleware])
});

export type AppDispatch = typeof store.dispatch;