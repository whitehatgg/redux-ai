# Redux AI - Intelligent State Augmentation

A powerful state augmentation system for Redux applications that enhances your store with intelligent workflow capabilities and AI-powered state management features.

## Core Features

- 🎯 Enhanced Redux state management with AI capabilities
- 🔄 Intelligent workflow middleware for action orchestration  
- 🧪 Type-safe state predictions and optimizations
- 🔌 Framework adapters for Express.js and Next.js
- 📦 Modular architecture with React components

## Quick Start

### Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/state @redux-ai/react

# Or using npm
npm install @redux-ai/state @redux-ai/react
```

### Basic Example

Here's how to set up Redux AI with React:

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import { createWorkflowMiddleware } from '@redux-ai/state';

// Create store with workflow middleware
const store = configureStore({
  reducer: {
    counter: counterReducer,
    // ... other reducers
  },
  middleware: (getDefault) => getDefault().concat(createWorkflowMiddleware())
});

export type RootState = ReturnType<typeof store.getState>;

// App.tsx
import { Provider } from 'react-redux';
import { ReduxAIProvider } from '@redux-ai/react';

function App() {
  return (
    <Provider store={store}>
      <ReduxAIProvider>
        <YourAppComponents />
      </ReduxAIProvider>
    </Provider>
  );
}

// Using in components
function Counter() {
  const dispatch = useDispatch();
  const count = useSelector((state: RootState) => state.counter.value);

  return (
    <button onClick={() => dispatch({ type: 'counter/increment' })}>
      Count: {count}
    </button>
  );
}
```

### Framework Integration

#### Express.js

```typescript
import express from 'express';
import { ExpressAdapter } from '@redux-ai/express';
import { runtime } from './config';

const adapter = new ExpressAdapter();
const handler = await adapter.createHandler({ runtime });

app.post('/api/ai', handler);
```

#### Next.js

```typescript
// pages/api/ai.ts
import { NextjsAdapter } from '@redux-ai/nextjs';
import { runtime } from '@/server/config';

export default async function handler(req, res) {
  const adapter = new NextjsAdapter();
  const handler = await adapter.createHandler({ runtime });
  return handler(req, res);
}
```

## Architecture

The project uses a monorepo structure with these key packages:

- `@redux-ai/state`: Core state augmentation with workflow support
- `@redux-ai/react`: React components and hooks for Redux AI integration
- `@redux-ai/express` & `@redux-ai/nextjs`: Framework adapters 
- `@redux-ai/vector`: Vector storage for state analysis
- `@redux-ai/openai`: OpenAI integration for AI capabilities

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

### React Integration

The React package includes:

- ReduxAIProvider for app integration
- Hooks for state interaction
- Type-safe components
- State prediction utilities
- Workflow visualization tools

## Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT