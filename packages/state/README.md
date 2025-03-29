# @redux-ai/state

Advanced intelligent runtime system for managing state in Redux applications with support for asynchronous effects.

## Features

- Integrates with Redux to manage state
- XState for advanced workflow and conversation state management
- AI-powered message and workflow interpretation
- **Effect tracking middleware** for coordinating asynchronous operations
- Conversation state management

## Effect Tracking Middleware

The Effect Tracking Middleware allows you to coordinate asynchronous operations with state machine workflows. This middleware is designed to handle various types of async patterns including:

- Redux Thunk
- RTK Query
- Redux Saga
- Promise middleware
- Custom async patterns via markAsEffect

The middleware ensures that all side effects complete before moving to the next step in a workflow.

### Usage

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState, createEffectTracker, markAsEffect } from '@redux-ai/state';
import { ReduxAIVector } from '@redux-ai/vector';
import rootReducer from './reducers';
import actions from './actions';

// Create the effect tracker
const effectTracker = createEffectTracker({ 
  debug: true,
  timeout: 30000, // 30 seconds timeout for effects
  onEffectsCompleted: () => console.log('All effects completed')
});

// Configure the Redux store with the effect tracker middleware
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(effectTracker.middleware)
});

// Create the Redux AI state
const aiState = createReduxAIState({
  store,
  actions,
  storage: new ReduxAIVector(),
  endpoint: 'https://your-ai-endpoint.com',
  debug: true,
  timeout: 30000,
  stepDelay: 1500 // 1.5 second delay between workflow steps for better UI visibility and non-tracked side effects
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

// Mark a regular action as having an async effect with promise
const promise = new Promise(resolve => setTimeout(resolve, 1000));
store.dispatch(markAsEffect(someAction(), { promise }));

// For Redux Saga or multi-step operations
// Start action
store.dispatch(markAsEffect(startSagaAction(), { 
  effectId: 'unique-operation-id',
  isStart: true 
}));

// Later, when the saga completes
store.dispatch(markAsEffect(endSagaAction(), { 
  effectId: 'unique-operation-id',
  isEnd: true 
}));
```

## API

### createEffectTracker(options)

Creates an effect tracker with middleware and utility methods.

Options:
- `debug`: Boolean - Enable debug logging
- `timeout`: Number - Timeout in milliseconds for pending effects (default: 30000)
- `onEffectsCompleted`: Function - Callback when all effects are completed

Returns an EffectTracker object with:
- `middleware`: Redux middleware
- `waitForEffects`: Function that returns a Promise that resolves when all effects complete

### markAsEffect(action, options)

Marks a Redux action as having an asynchronous effect.

Parameters:
- `action`: The Redux action to mark
- `options`: Configuration object with the following properties:
  - `promise`: Optional promise to track with this effect
  - `effectId`: Optional ID to identify this effect (useful for saga start/end pairs)
  - `isStart`: Indicates this is the start of a saga or other multi-step async operation
  - `isEnd`: Indicates this is the end of a saga or other multi-step async operation

Returns the action with effect metadata added.

For backwards compatibility, you can also pass a promise directly as the second parameter:
```typescript
markAsEffect(action, promise); // Equivalent to markAsEffect(action, { promise })
```

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
4. **Explicitly marked actions** - Using markAsEffect helper
5. **Redux Saga** - Using markAsEffect with isStart/isEnd flags