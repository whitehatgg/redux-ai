import { configureStore } from '@reduxjs/toolkit';
import demoReducer, { type DemoState } from './slices/demoSlice';
import applicantReducer, { type ApplicantState } from './slices/applicantSlice';

export interface RootState {
  demo: DemoState;
  applicant: ApplicantState;
}

// Create the Redux store with the demo reducer
export const store = configureStore({
  reducer: {
    demo: demoReducer,
    applicant: applicantReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
});

export type AppDispatch = typeof store.dispatch;