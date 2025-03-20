# @redux-ai/state

Core state management functionality for Redux AI, providing intelligent state tracking and prediction capabilities powered by vector storage and XState machines.

## Features

- 🎯 Enhanced Redux state management with AI capabilities
- 🔄 Intelligent workflow middleware for action orchestration  
- 🧪 Type-safe state predictions and optimizations
- 🔌 Framework adapters for Express.js and Next.js
- 📦 Modular architecture with React components

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/state

# Or using npm
npm install @redux-ai/state
```

## Usage

### Basic Setup

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createWorkflowMiddleware } from '@redux-ai/state';

// Create the workflow middleware
const workflowMiddleware = createWorkflowMiddleware();

// Create store with middleware
const store = configureStore({
  reducer: {
    // Your reducers here
    counter: counterReducer,
  },
  middleware: (getDefault) => 
    getDefault().concat(workflowMiddleware)
});

// The store automatically handles workflow actions
store.dispatch({ type: 'counter/increment' });
```

### State Machine Integration

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

## Features in Detail

### State Augmentation

Redux AI enhances your Redux store with:

- Intelligent action handling and prediction
- State flow optimization
- Automated workflow management
- Type-safe state transitions
- AI-powered state suggestions

### Workflow Management

The workflow middleware provides:

- Action orchestration and sequencing
- Side effect handling
- Error recovery
- State transition monitoring
- Automated testing support

## Development

```bash
# Build package
pnpm build

# Run tests
pnpm test
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT