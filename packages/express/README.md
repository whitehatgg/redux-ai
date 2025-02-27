# @redux-ai/express

Express.js adapter for Redux AI toolkit, providing minimal and focused request handling functionality.

## Features

- Lightweight Express.js adapter implementation
- Core request handler creation
- Framework-agnostic AI query processing
- Clean separation of concerns

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/express

# Or using npm
npm install @redux-ai/express
```

## Usage

The Express adapter provides a minimal interface for integrating Redux AI with Express.js applications:

```typescript
import { ExpressAdapter } from '@redux-ai/express';
import { createRuntime } from '@redux-ai/runtime';

// Create runtime instance
const runtime = createRuntime({
  provider: yourProvider,
});

// Create adapter and handler
const adapter = new ExpressAdapter();
const handler = adapter.createHandler({ runtime });

// Basic route setup
app.post('/api/query', handler);
```

### Error Handling

The adapter provides standardized error handling through the runtime:

```typescript
try {
  await handler(req, res);
} catch (error) {
  // Error response will be handled by the adapter
  console.error('Error:', error);
}
```

## Application-level Concerns

The adapter focuses solely on request handling. For application-specific concerns like:

- Request validation
- API key verification
- Request/response logging
- Rate limiting
- Authentication

These should be implemented at the application level using standard Express middleware. See the server demo in the repository for reference implementations.

## API Reference

### `ExpressAdapter`

Extends the base adapter from `@redux-ai/runtime`:

```typescript
class ExpressAdapter extends BaseAdapter {
  createHandler(config: RuntimeAdapterConfig): RequestHandler;
}
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
