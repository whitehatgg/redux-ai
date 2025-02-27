# Redux AI State Management Library

An advanced AI-powered Redux toolkit that provides intelligent state management with retrieval-augmented generation (RAG) capabilities, focusing on dynamic runtime middleware and intelligent state rehydration.

## Features

- 🧠 TypeScript-based state intelligence
- 🐛 Advanced error detection and resolution
- 📊 Dynamic state visualization and debugging tools
- ⚡ Optimized performance monitoring
- 📦 Robust vector storage and indexing
- 🔄 Standardized framework adapters (Express.js, Next.js)
- 🤖 OpenAI and LangChain integrations
- 🔍 Vector-based state retrieval and similarity search

## Architecture

The project is structured as a monorepo with the following packages:

### @redux-ai/runtime

Core runtime engine providing base functionality:

- Base adapter interface for framework integration
- Provider system for LLM integrations
- Standardized error handling
- Type-safe runtime configuration

### @redux-ai/express

Express.js adapter implementation:

- Minimal adapter for Express.js integration
- Core request handling and error management
- Runtime configuration support
- Framework-agnostic AI query processing

Note: Application-specific middleware (validation, logging, API key checks) should be implemented at the application level. See the server demo for reference implementations.

### @redux-ai/nextjs

Next.js adapter implementation:

- Server-side rendering support
- API route handlers
- Edge runtime compatibility
- Streaming SSR support

### @redux-ai/vector

Vector storage and similarity search functionality:

- Efficient vector storage and retrieval
- Cosine similarity-based search
- Real-time state tracking
- Subscription-based updates

### @redux-ai/state

Core state management functionality:

- AI-powered state tracking
- Automatic action suggestion
- Vector storage integration
- XState machine integration

### @redux-ai/react

React components and hooks:

- Debug components for Redux state inspection
- Vector similarity search visualization
- Real-time activity logging
- AI-powered state inspection tools

## Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Usage

### Basic Setup

```typescript
import { createRuntime } from '@redux-ai/runtime';
import { ExpressAdapter } from '@redux-ai/express';
import { OpenAIProvider } from '@redux-ai/openai';

// Create runtime with OpenAI provider
const runtime = createRuntime({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

// Create Express adapter
const adapter = new ExpressAdapter();
const handler = adapter.createHandler({ runtime });

// Set up Express routes
app.post('/api/query', validateQuery, checkAIConfig, logAIRequest, handler);
```

### Next.js Integration

```typescript
import { createRuntime } from '@redux-ai/runtime';
import { NextjsAdapter } from '@redux-ai/nextjs';

export default function handler(req, res) {
  const adapter = new NextjsAdapter();
  const handler = adapter.createHandler({
    runtime,
    endpoint: '/api/query',
  });

  return handler(req, res);
}
```

### Debug Components

```typescript
import { VectorDebugger, ActivityLog } from '@redux-ai/react';

const DebugPanel = () => {
  return (
    <div className="debug-panel">
      <VectorDebugger />
      <ActivityLog />
    </div>
  );
};
```

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

### Type Checking

```bash
pnpm typecheck
```

## Technical Details

### Framework Adapters

The adapter system provides a standardized way to integrate with different frameworks:

- Common error handling through `BaseAdapter`
- Consistent runtime configuration
- Framework-specific optimizations
- Type-safe request/response handling

### Vector Storage

The vector storage system implements:

- Efficient text-to-vector encoding
- Cosine similarity matching
- Real-time subscription system
- Automatic garbage collection

### Performance Optimization

- Efficient vector calculations
- Batch updates for storage operations
- Memoized React components
- Framework-specific optimizations

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
