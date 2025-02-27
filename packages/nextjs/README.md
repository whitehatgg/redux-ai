# @redux-ai/nextjs

Next.js adapter for Redux AI toolkit, providing server-side rendering support and optimized integration.

## Features

- Next.js adapter implementation
- Server-side rendering (SSR) support
- API route handlers
- Edge runtime compatibility
- Streaming SSR support
- Type-safe page props

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/nextjs

# Or using npm
npm install @redux-ai/nextjs
```

## Usage

### API Routes

```typescript
import { NextjsAdapter } from '@redux-ai/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const adapter = new NextjsAdapter();
  const handler = adapter.createHandler({
    runtime,
    endpoint: '/api/query',
  });

  return handler(req, res);
}
```

### Edge Runtime

```typescript
import { NextjsAdapter } from '@redux-ai/nextjs';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const adapter = new NextjsAdapter();
  const handler = adapter.createHandler({ runtime });

  return handler(req);
}
```

## API Reference

### `NextjsAdapter`

Extends the base adapter from `@redux-ai/runtime`:

```typescript
class NextjsAdapter extends BaseAdapter {
  createHandler(config: RuntimeAdapterConfig): NextApiHandler;
}
```

### Configuration

```typescript
interface RuntimeAdapterConfig {
  runtime: Runtime;
  endpoint?: string;
}
```

## Error Handling

The adapter provides standardized error handling:

```typescript
try {
  await handler(req, res);
} catch (error) {
  // Error response will be handled by the adapter
  console.error('Error:', error);
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
