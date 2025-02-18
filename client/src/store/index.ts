import { configureStore } from '@reduxjs/toolkit';
import applicantReducer, { type ApplicantState } from './slices/applicantSlice';

export interface RootState {
  applicant: ApplicantState;
}

export const store = configureStore({
  reducer: {
    applicant: applicantReducer
  }
});

export type AppDispatch = typeof store.dispatch;