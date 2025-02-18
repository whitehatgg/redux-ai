import { configureStore } from '@reduxjs/toolkit';
import applicantReducer, { type ApplicantState } from './slices/applicantSlice';

export interface RootState {
  applicant: ApplicantState;
}

export const store = configureStore({
  reducer: {
    applicant: applicantReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
});

export type AppDispatch = typeof store.dispatch;