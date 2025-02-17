import { configureStore } from '@reduxjs/toolkit';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createReduxAIState } from '@redux-ai/state';
import { counterSchema, messageSchema } from './schema';

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

// Create ReduxAI state manager with schema validation
export const reduxAI = createReduxAIState({
  store,
  schema: counterSchema, // We can extend this to handle multiple schemas
  onError: (error) => {
    console.error('ReduxAI Error:', error);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;