# @redux-ai/state

Advanced intelligent runtime system for managing state in Redux applications with support for asynchronous effects.

## Features

- Integrates with Redux to manage state
- XState for advanced workflow and conversation state management
- AI-powered message and workflow interpretation
- **Effect tracking middleware** for coordinating asynchronous operations
- Conversation state management

## Redux AI Middleware

The Redux AI Middleware allows you to coordinate asynchronous operations with state machine workflows. This middleware is designed to handle various types of async patterns including:

- Redux Thunk
- RTK Query
- Redux Saga
- Promise middleware
- Automatic detection of custom async operation patterns

The middleware ensures that all side effects complete before moving to the next step in a workflow.

### Usage

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState, createReduxAIMiddleware } from '@redux-ai/state';
import { ReduxAIVector } from '@redux-ai/vector';
import rootReducer from './reducers';
import actions from './actions';

// Create the Redux AI middleware
const effectTracker = createReduxAIMiddleware({
  debug: true,
  timeout: 30000, // 30 seconds timeout for effects
  onEffectsCompleted: () => console.log('All effects completed'),
});

// Configure the Redux store with the effect tracker middleware
const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(effectTracker.middleware),
});

// Create the Redux AI state
const aiState = createReduxAIState({
  store,
  actions,
  storage: new ReduxAIVector(),
  endpoint: 'https://your-ai-endpoint.com',
  debug: true,
  timeout: 30000,
  stepDelay: 1500, // 1.5 second delay between workflow steps for better UI visibility and non-tracked side effects
});

// Use in an async function
async function performOperation() {
  // Dispatch an action that may trigger async effects
  store.dispatch(someAsyncThunk());

  // Wait for all pending effects to complete
  await aiState.waitForEffects();

  // Now you can safely proceed with the next step
  console.log('All effects completed, proceeding to next step');
}

// With RTK Query
const { data } = await store.dispatch(api.endpoints.getUser.initiate(123));
await aiState.waitForEffects();

// For custom async operations, use standard patterns, the middleware will detect them automatically
// Pattern: Create pending/fulfilled/rejected actions with a consistent base name
const startAsyncOperation = () => {
  // Dispatch a "pending" action
  store.dispatch({ type: 'myFeature/asyncOperation/pending' });

  // Perform async work and dispatch fulfilled when done
  setTimeout(() => {
    store.dispatch({ type: 'myFeature/asyncOperation/fulfilled' });
  }, 1000);
};

// The middleware will automatically track operations that follow common patterns
startAsyncOperation();
await aiState.waitForEffects(); // Will wait until the operation is complete
```

## API

### createReduxAIMiddleware(options)

Creates a Redux AI middleware with effect tracking and utility methods.

Options:

- `debug`: Boolean - Enable debug logging
- `timeout`: Number - Timeout in milliseconds for pending effects (default: 30000)
- `onEffectsCompleted`: Function - Callback when all effects are completed

Returns an EffectTracker object with:

- `middleware`: Redux middleware
- `waitForEffects`: Function that returns a Promise that resolves when all effects complete
- `getSideEffectInfo`: Function that returns information about tracked side effects
- `resetSideEffectInfo`: Function that resets the tracking information

### Automatic Effect Detection

The middleware automatically detects various async effect patterns without requiring manual marking. This includes:

1. **Redux Thunk** - When a thunk returns a promise
2. **RTK Query** - By tracking the requestId in pending/fulfilled/rejected actions
3. **Promise middleware** - When action.payload is a promise
4. **Common async patterns** - Tracking pending/fulfilled/rejected action types with consistent base names

For most use cases, you won't need to mark effects manually - just dispatch your actions as usual, and the middleware will detect and track them automatically.

### ReduxAIState

The main class for managing AI state.

Configuration:

- `store`: Redux store instance
- `actions`: Available actions mapping
- `storage`: Vector storage instance
- `endpoint`: AI endpoint URL
- `debug`: Enable debug logging
- `timeout`: Timeout for effect completion (ms)
- `stepDelay`: Delay between workflow steps (ms) for better UI visibility and ensuring non-tracked side effects can complete

Methods:

- `waitForEffects()`: Wait for all pending effects to complete
- `processQuery(query)`: Process a user query and handle AI response

## Handled Async Patterns

The middleware automatically detects and tracks:

1. **Redux Thunk** - When a thunk returns a promise
2. **RTK Query** - By tracking the requestId in pending/fulfilled/rejected actions
3. **Promise middleware** - When action.payload is a promise
4. **Common async patterns** - Tracking pending/fulfilled/rejected action types with consistent base names
5. **Redux Saga** - By detecting the pattern of start/end actions
