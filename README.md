# Redux AI State Management Library

An advanced AI-powered Redux toolkit that provides intelligent state management with retrieval-augmented generation (RAG) capabilities, focusing on dynamic runtime middleware and intelligent state rehydration.

## Features

- 🧠 TypeScript-based state intelligence with modern Redux patterns
- 🐛 Advanced error detection and resolution with comprehensive logging
- 📊 Dynamic state visualization and debugging tools with React components
- ⚡ Optimized performance monitoring and caching strategies
- 📦 Robust vector storage and indexing with efficient similarity search
- 🔄 Framework adapters (Express.js, Next.js) with standardized APIs
- 🤖 OpenAI and LangChain integrations with streaming support
- 🔍 Vector-based state retrieval with real-time updates

## Architecture

The project is structured as a monorepo with the following packages:

### @redux-ai/runtime (Core)

Core runtime engine providing base functionality:

- Standardized adapter interface with TypeScript types
- Pluggable provider system for AI integrations
- Advanced error handling and logging
- Type-safe configuration management

### @redux-ai/express

Express.js adapter implementation:

- Minimal Express.js integration with middleware support
- Robust request handling and error management
- Runtime configuration with environment variables
- Framework-agnostic AI query processing

### @redux-ai/nextjs

Next.js adapter implementation:

- Full server-side rendering support
- API route handlers with streaming capabilities
- Edge runtime compatibility
- Optimized streaming SSR

### @redux-ai/vector

Vector storage and similarity search:

- Efficient vector storage with indexing
- Real-time cosine similarity search
- Subscription-based state tracking
- Automatic garbage collection

### @redux-ai/state

Core state management:

- AI-powered state tracking and prediction
- Automatic action suggestions based on state
- Seamless vector storage integration
- XState machine integration for complex flows

### @redux-ai/react

React integration:

- Debug components for Redux inspection
- Vector similarity search visualization
- Real-time activity monitoring
- AI-powered state inspection tools

### @redux-ai/langchain

LangChain integration:

- Seamless LangChain.js compatibility
- Streaming chat completions
- RAG-enabled state management
- Custom chain development utilities

### @redux-ai/openai

OpenAI integration:

- Direct OpenAI API integration
- Streaming response support
- Token usage optimization
- Rate limiting and error handling

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

- Efficient vector calculations with WebAssembly
- Batch updates for storage operations
- Memoized React components
- Framework-specific optimizations

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
