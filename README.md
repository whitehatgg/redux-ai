# Redux AI State Management Library

An advanced AI-powered Redux state management library that provides intelligent, context-aware state tracking with enhanced debugging capabilities.

## Features

- 🧠 TypeScript-based state intelligence
- 🐛 Advanced error detection and resolution
- 📊 Dynamic state visualization and debugging tools
- ⚡ Optimized performance monitoring
- 📦 Robust vector storage and indexing

## Architecture

The project is structured as a monorepo with the following packages:

### @redux-ai/vector

Handles vector storage and similarity search functionality using IndexedDB for persistent storage. Features include:

- Efficient vector storage and retrieval
- Cosine similarity-based search
- Real-time state tracking
- Subscription-based updates

### @redux-ai/react

React components and hooks for debugging and visualizing Redux state:

- `VectorDebugger`: Displays available actions and their metadata
- `RAGResults`: Visualizes vector similarity search results
- `ActivityLog`: Real-time logging of vector operations
- Custom hooks for accessing vector storage

### @redux-ai/state

Core state management functionality:

- AI-powered state tracking
- Automatic action suggestion
- State prediction and optimization

### @redux-ai/schema

Schema definitions and type utilities:

- Redux action schemas
- State validation rules
- Type definitions for the entire system

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
import { ReduxAIProvider } from '@redux-ai/react';
import { createReduxAIVector } from '@redux-ai/vector';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer
});

const App = () => {
  return (
    <ReduxAIProvider
      store={store}
      availableActions={[
        {
          type: 'users/add',
          description: 'Add a new user to the system',
          keywords: ['user', 'create', 'add']
        }
      ]}
    >
      <YourApp />
    </ReduxAIProvider>
  );
};
```

### Debug Components

```typescript
import { VectorDebugger, ActivityLog, RAGResults } from '@redux-ai/react';

const DebugPanel = () => {
  return (
    <div>
      <VectorDebugger />
      <ActivityLog />
      <RAGResults results={vectorResults} />
    </div>
  );
};
```

### Vector Storage

```typescript
import { useVectorDebug } from '@redux-ai/react';

const VectorViewer = () => {
  const { entries, isLoading, error } = useVectorDebug();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {entries.map(entry => (
        <div key={entry.timestamp}>
          <p>Query: {entry.query}</p>
          <p>Response: {entry.response}</p>
        </div>
      ))}
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
cd packages/vector && pnpm build
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

### Vector Storage

The vector storage system uses IndexedDB for persistent storage and implements:

- Simple but effective text-to-vector encoding
- Cosine similarity for vector matching
- Real-time subscription system for updates
- Automatic garbage collection for old entries

### Debugging Tools

The debugging interface provides:

- Real-time state visualization
- Vector similarity search results
- Activity logging with timestamps
- Available action suggestions

### Performance Optimization

- Efficient vector calculations
- Batch updates for IndexedDB operations
- Memoized React components
- Optimized re-rendering patterns

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
