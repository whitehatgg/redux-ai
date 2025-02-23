# @redux-ai/state

Core state management functionality for Redux AI, providing intelligent state tracking and prediction capabilities powered by vector storage and XState machines.

## Features

- AI-powered state tracking with TypeScript
- Automatic action suggestion based on state patterns
- Vector storage integration for historical analysis
- XState machine integration for complex state flows
- Efficient state diffing and change tracking
- Redux Toolkit middleware and enhancers
- Type-safe state prediction and optimization

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/state

# Or using npm
npm install @redux-ai/state
```

## Usage

```typescript
import { createAIStore, type AIState } from '@redux-ai/state';
import type { RootState } from './types';

// Create an AI-powered store
const store = createAIStore<RootState>({
  reducer: rootReducer,
  initialState: {},
  vectorConfig: {
    dimensions: 128,
  },
  predictorConfig: {
    confidenceThreshold: 0.8,
    maxPredictions: 5,
  },
});

// The store automatically tracks state changes
store.subscribe(() => {
  const state = store.getState();
  const suggestions = store.getSuggestions();
  console.log('Suggested actions:', suggestions);
});

// Use the AI middleware
const aiMiddleware = createAIMiddleware({
  enablePrediction: true,
  trackingConfig: {
    includeMeta: true,
    storeHistory: true,
  },
});

// Add to your Redux store
const store = configureStore({
  reducer: rootReducer,
  middleware: getDefault => getDefault().concat(aiMiddleware),
});
```

## API Reference

### Store Configuration

#### `createAIStore(config)`

Creates a new Redux store with AI capabilities.

```typescript
type AIStoreConfig<S> = {
  reducer: Reducer<S>;
  initialState: S;
  vectorConfig: VectorConfig;
  predictorConfig?: PredictorConfig;
};
```

#### Parameters

- `reducer` (Reducer) - Root reducer function
- `initialState` (State) - Initial state object
- `vectorConfig` (VectorConfig) - Vector storage configuration
- `predictorConfig` (PredictorConfig, optional) - AI predictor settings

### Methods

#### AI Store Methods

- `getSuggestions()`: Get AI-suggested actions based on current state
- `predictStateChange(action)`: Predict state after an action
- `getOptimizedActions()`: Get optimized action sequences
- `getStateAnalytics()`: Get analytics about state changes

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Type Safety

The package is written in TypeScript and provides strong type safety:

```typescript
import type { AIState, AIAction } from '@redux-ai/state';

// State types are properly inferred
const state: AIState = store.getState();

// Actions are type-checked
store.dispatch<AIAction>({
  type: 'AI_PREDICT',
  payload: {
    confidenceThreshold: 0.9,
  },
});
```

## State Machine Integration

```typescript
import { createStateMachine } from '@redux-ai/state';

const authMachine = createStateMachine({
  id: 'auth',
  initial: 'idle',
  states: {
    idle: {
      on: { LOGIN: 'authenticating' },
    },
    authenticating: {
      on: {
        SUCCESS: 'authenticated',
        ERROR: 'error',
      },
    },
  },
});

// Integrate with Redux store
store.attachStateMachine(authMachine);
```

## Performance Optimization

- Efficient state diffing for change detection
- Batched updates for prediction calculations
- Cached suggestion results
- Configurable tracking granularity

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
