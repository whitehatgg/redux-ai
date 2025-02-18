import { configureStore } from '@reduxjs/toolkit';
import demoReducer from './slices/demoSlice';
import applicantReducer from './slices/applicantSlice';

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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;