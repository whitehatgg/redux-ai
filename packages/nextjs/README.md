# @redux-ai/nextjs

Next.js integration for Redux AI toolkit, providing server-side rendering support and Next.js-specific optimizations.

## Features

- Next.js server-side rendering (SSR) support
- Optimized state hydration
- Next.js API route helpers
- Edge runtime compatibility
- Middleware integrations
- Type-safe page props
- Automatic revalidation
- Streaming SSR support

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/nextjs

# Or using npm
npm install @redux-ai/nextjs
```

## Usage

### Page Wrapper

```typescript
import { withReduxAI } from '@redux-ai/nextjs';
import type { GetServerSideProps } from 'next';

// Wrap your Next.js pages
const YourPage = ({ data }) => {
  // Your page component
  return <div>{/* Your content */}</div>;
};

export const getServerSideProps: GetServerSideProps = withReduxAI(async (ctx) => {
  // Your getServerSideProps logic
  return {
    props: {
      // Your props
    }
  };
});

export default withReduxAI(YourPage);
```

### API Routes

Create AI-powered API routes:

```typescript
import { createAIHandler } from '@redux-ai/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default createAIHandler({
  handler: async (req: NextApiRequest, res: NextApiResponse) => {
    const response = await runtime.process([{ role: 'user', content: req.body.message }]);

    res.json(response);
  },
  config: {
    runtime: 'edge', // Optional: Use edge runtime
    revalidate: 60, // Optional: Enable ISR
  },
});
```

### Middleware Integration

```typescript
import { createAIMiddleware } from '@redux-ai/nextjs';

export default createAIMiddleware({
  matcher: '/api/ai/:path*',
  config: {
    // Middleware configuration
  },
});
```

### State Hydration

```typescript
import { hydrateAIState } from '@redux-ai/nextjs';

export default function App({ Component, pageProps }) {
  // Hydrate AI state on client
  useEffect(() => {
    hydrateAIState(pageProps.initialAIState);
  }, [pageProps.initialAIState]);

  return <Component {...pageProps} />;
}
```

## Edge Runtime Support

Enable edge runtime for better performance:

```typescript
import { createEdgeAIHandler } from '@redux-ai/nextjs/edge';

export default createEdgeAIHandler({
  handler: async req => {
    // Your edge runtime handler
  },
  config: {
    regions: ['iad1', 'sfo1'], // Optional: Deploy to specific regions
    cache: 'force-cache', // Optional: Control caching behavior
  },
});
```

## Streaming SSR

Support streaming responses in SSR:

```typescript
import { withStreamingAI } from '@redux-ai/nextjs';

const StreamingPage = withStreamingAI(({ stream }) => {
  return (
    <Suspense fallback={<Loading />}>
      <AIResponse stream={stream} />
    </Suspense>
  );
});
```

## Testing

The package includes comprehensive tests:

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Test Utilities

```typescript
import { createMockAIContext } from '@redux-ai/nextjs/testing';

const mockContext = createMockAIContext({
  req: {
    method: 'POST',
    body: { message: 'Test' },
  },
});
```

## Error Handling

Handle Next.js-specific errors:

```typescript
import { NextAIError, HydrationError } from '@redux-ai/nextjs';

try {
  await handler(req, res);
} catch (error) {
  if (error instanceof HydrationError) {
    // Handle hydration errors
  } else if (error instanceof NextAIError) {
    // Handle other Next.js-specific errors
  }
}
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
