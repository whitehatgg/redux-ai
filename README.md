# Redux AI - Intelligent State Augmentation for Redux

A sophisticated augmentation layer for Redux that enhances your existing state management with intelligent features, focusing on AI-powered runtime middleware and intelligent state rehydration capabilities.

## Features

- 🧠 Intelligent Redux augmentation with modern TypeScript patterns
- 🔄 Chain-of-thought reasoning with comprehensive activity logging
- 🐛 Direct error propagation with transparent LLM error messages
- 📦 Framework adapters (Express.js, Next.js) with standardized APIs
- 🤖 OpenAI and LangChain integrations with JSON format support

## Quick Start

### Install Dependencies

```bash
pnpm install
pnpm build
```

### Basic Setup

```typescript
// server/config.ts
import { OpenAIProvider } from '@redux-ai/openai';
import { createRuntime } from '@redux-ai/runtime';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  temperature: 0.7,
  maxTokens: 1000
});

export const runtime = createRuntime({
  provider
});
```

### Express Integration

```typescript
// server/routes.ts
import express from 'express';
import { ExpressAdapter } from '@redux-ai/express';
import { runtime } from './config';

const adapter = new ExpressAdapter();
const handler = await adapter.createHandler({ runtime });

app.post('/api/query', handler);
```

### Next.js Integration

```typescript
// pages/api/ai.ts
import { NextjsAdapter } from '@redux-ai/nextjs';
import { runtime } from '@/server/config';

export default async function handler(req, res) {
  const adapter = new NextjsAdapter();
  const handler = await adapter.createHandler({
    runtime,
    endpoint: '/api/ai'
  });

  return handler(req, res);
}
```

### Using Multiple Providers

You can use different LLM providers like OpenAI or LangChain:

```typescript
// OpenAI Provider
const openaiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  temperature: 0.7
});

// LangChain Provider
import { ChatOpenAI } from '@langchain/openai';
const model = new ChatOpenAI({ 
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o'
});

const langchainProvider = new LangChainProvider({
  model,
  timeout: 30000
});
```

### Making Queries

The runtime supports different types of queries:

```typescript
// Action Query
const actionResult = await runtime.query({
  query: 'create a new task called "Review PR"',
  actions: {
    createTask: {
      type: 'task/create',
      params: ['title']
    }
  }
});

// State Query
const stateResult = await runtime.query({
  query: 'show me all completed tasks',
  state: {
    tasks: [
      { id: 1, title: 'Review PR', completed: true },
      { id: 2, title: 'Update docs', completed: false }
    ]
  }
});

// Multi-step Workflow
const workflowResult = await runtime.query({
  query: 'search for John and disable the name column',
  actions: {
    search: {
      type: 'search',
      params: ['term']
    },
    setVisibleColumns: {
      type: 'setVisibleColumns',
      params: ['columns']
    }
  }
});
```

## Architecture

The project uses a monorepo structure with the following packages:

### @redux-ai/runtime (Core)
- Standardized adapter interface with TypeScript types
- Chain-of-thought reasoning with activity logging
- Direct error propagation with full context
- Workflow processing for multi-step operations

### @redux-ai/express & @redux-ai/nextjs
- Framework-specific adapters with minimal integration code
- Direct error propagation from runtime
- Runtime configuration with environment variables

### @redux-ai/langchain & @redux-ai/openai
- Provider implementations for different LLM services
- JSON response format support
- Streaming capabilities where supported

## Development

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
cd packages/<package-name> && pnpm build
```

### Running Tests

```bash
pnpm test
```

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT