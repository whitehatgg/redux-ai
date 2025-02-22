# @redux-ai/vector

Vector storage and similarity search functionality for Redux AI, providing efficient state tracking and intelligent querying capabilities.

## Features

- Efficient vector storage and retrieval using IndexedDB
- Cosine similarity-based search with customizable dimensions
- Real-time state tracking and updates
- Subscription-based update notifications
- Automatic garbage collection for old entries
- TypeScript-first implementation

## Installation

```bash
pnpm add @redux-ai/vector
```

## Usage

```typescript
import { VectorStorage, type VectorConfig } from '@redux-ai/vector';

// Initialize storage with custom configuration
const storage = await VectorStorage.create({
  dimensions: 128,
});

// Store an interaction with metadata
await storage.storeInteraction(
  'What is the current user state?',
  'User is logged in and viewing dashboard',
  {
    userId: 123,
    view: 'dashboard',
    timestamp: Date.now(),
  }
);

// Retrieve similar interactions
const results = await storage.retrieveSimilar(
  'Show me user status',
  5 // limit
);

// Subscribe to new entries
const unsubscribe = storage.subscribe(entry => {
  console.log('New vector entry:', entry.metadata);
});

// Clean up subscription when done
unsubscribe();
```

## API Reference

### `VectorStorage.create(config)`

Creates a new vector storage instance.

#### Parameters

- `config` (VectorConfig)
  - `dimensions` (number) - Vector dimensions for text encoding
  - `gcThreshold` (number, optional) - Age threshold for garbage collection

#### Returns

Returns a Promise that resolves to a new VectorStorage instance.

### Methods

#### `storeInteraction(query: string, response: string, state: unknown)`

Stores a new interaction with the given query, response, and state metadata.

#### `retrieveSimilar(query: string, limit?: number)`

Finds similar interactions using cosine similarity.

#### `getAllEntries()`

Returns all stored vector entries.

#### `subscribe(listener: (entry: VectorEntry) => void)`

Subscribe to new entries. Returns an unsubscribe function.

### Types

```typescript
interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
  timestamp: number;
}

interface VectorConfig {
  dimensions: number;
  gcThreshold?: number;
}
```

## Performance Considerations

- The vector storage uses efficient array operations for similarity calculations
- Automatic garbage collection prevents memory bloat
- Batch operations are used for IndexedDB interactions
- Memoized vector calculations improve search performance
