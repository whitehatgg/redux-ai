import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DemoState {
  counter: number;
  message: string;
}

const initialState: DemoState = {
  counter: 0,
  message: '',
};

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    increment: (state) => {
      state.counter += 1;
      console.log('Counter incremented to:', state.counter);
    },
    decrement: (state) => {
      state.counter -= 1;
      console.log('Counter decremented to:', state.counter);
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
      console.log('Message set to:', state.message);
    },
    resetCounter: (state) => {
      state.counter = 0;
      console.log('Counter reset to:', state.counter);
    },
  },
});

export const { increment, decrement, setMessage, resetCounter } = demoSlice.actions;
export default demoSlice.reducer;
export type { DemoState };