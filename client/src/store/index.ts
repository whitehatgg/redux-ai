import { configureStore } from '@reduxjs/toolkit';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DemoState {
  count: number;
  message: string;
}

const initialState: DemoState = {
  count: 0,
  message: ''
};

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    decrement: (state) => {
      state.count -= 1;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    }
  }
});

export const { increment, decrement, setMessage } = demoSlice.actions;

export const store = configureStore({
  reducer: {
    demo: demoSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
