import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import applicantReducer from './slices/applicantSlice';

const makeStore = () =>
  configureStore({
    reducer: {
      applicant: applicantReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });

// Types for store
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<AppStore>(makeStore);