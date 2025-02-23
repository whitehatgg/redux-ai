# @redux-ai/vector

Vector storage and similarity search functionality for Redux AI, providing efficient state tracking and intelligent querying capabilities.

## Features

- Efficient vector storage and retrieval using IndexedDB
- Cosine similarity-based search with customizable dimensions
- Real-time state tracking and updates
- Subscription-based update notifications
- Automatic garbage collection for old entries
- TypeScript-first implementation
- Performance-optimized similarity calculations
- Batch operation support

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/vector

# Or using npm
npm install @redux-ai/vector
```

## Usage

```typescript
import { VectorStorage, type VectorConfig } from '@redux-ai/vector';

// Initialize storage with custom configuration
const storage = await VectorStorage.create({
  dimensions: 128,
  gcThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days
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
  - `gcThreshold` (number, optional) - Age threshold for garbage collection in milliseconds

#### Returns

Returns a Promise that resolves to a new VectorStorage instance.

### Methods

#### `storeInteraction(query: string, response: string, metadata: Record<string, unknown>)`

Stores a new interaction with the given query, response, and metadata.

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

## Performance Optimization

```typescript
import { VectorStorage, optimizeStorage } from '@redux-ai/vector';

// Create a storage instance with optimized settings
const storage = await VectorStorage.create({
  dimensions: 128,
  optimizations: {
    batchSize: 100,
    cacheSize: 1000,
    useWebWorker: true,
  },
});

// Optimize existing storage
await optimizeStorage(storage, {
  deduplication: true,
  compaction: true,
});
```

## Error Handling

```typescript
import { VectorStorageError, DimensionMismatchError } from '@redux-ai/vector';

try {
  await storage.storeInteraction(query, response, metadata);
} catch (error) {
  if (error instanceof DimensionMismatchError) {
    console.error('Vector dimensions do not match:', error.message);
  } else if (error instanceof VectorStorageError) {
    console.error('Storage error:', error.message);
  }
}
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Test Utilities

```typescript
import { createMockStorage } from '@redux-ai/vector/testing';

const mockStorage = createMockStorage({
  dimensions: 128,
  entries: [
    {
      id: 'test-1',
      vector: new Array(128).fill(0),
      metadata: { test: true },
    },
  ],
});
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
