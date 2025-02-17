import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DemoState {
  counter: number;
  message: string;
}

const initialState: DemoState = {
  counter: 0,
  message: '',
};

export const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    increment: (state) => {
      state.counter += 1;
    },
    decrement: (state) => {
      state.counter -= 1;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    resetCounter: (state) => {
      state.counter = 0;
    },
  },
});

export const { increment, decrement, setMessage, resetCounter } = demoSlice.actions;
export default demoSlice.reducer;
