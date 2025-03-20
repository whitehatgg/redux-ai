# Redux AI - Intelligent State Management

A sophisticated state management system that enhances Redux with AI-powered workflow capabilities, featuring:

- 🧠 Intelligent action handling with TypeScript support
- 🔄 Multi-step workflow processing
- 🐛 Built-in error handling and timeout management
- 📦 Framework adapters for Express.js and Next.js

## Quick Start

### Install Dependencies

```bash
pnpm install
```

### Simple Example

Here's a minimal example showing how to use Redux AI:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createReduxAIState, createWorkflowMiddleware } from '@redux-ai/state';

// Create store with workflow middleware
const store = configureStore({
  reducer: (state = {}, action) => {
    switch (action.type) {
      case 'UPDATE_USER':
        return { ...state, user: action.payload };
      default:
        return state;
    }
  },
  middleware: (getDefault) => getDefault().concat(
    createWorkflowMiddleware({
      sideEffectTypes: ['UPDATE_USER']
    })
  )
});

// Define your actions
const actions = {
  updateUser: (data) => ({ 
    type: 'UPDATE_USER',
    payload: data 
  })
};

// Initialize ReduxAIState
const ai = createReduxAIState({
  store,
  actions,
  storage: {
    storeInteraction: async (query, response) => {
      console.log('Interaction:', { query, response });
    }
  },
  endpoint: '/api/ai'
});

// Process a query that updates user data
ai.processQuery('update the user status to active')
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
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

## Project Structure

The project uses a monorepo structure with these key packages:

- `@redux-ai/state`: Core state management with workflow support
- `@redux-ai/express` & `@redux-ai/nextjs`: Framework adapters
- `@redux-ai/openai`: OpenAI provider implementation
- `@redux-ai/vector`: Vector storage for interaction history

## Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT