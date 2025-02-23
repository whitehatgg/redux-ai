# @redux-ai/openai

OpenAI integration for Redux AI toolkit, providing direct access to OpenAI's models and APIs with smart handling of retries, rate limits, and streaming.

## Features

- OpenAI API integration with smart retries
- Type-safe model configurations
- Streaming response support
- Rate limiting and retry handling
- Error handling and type validation
- Function calling support
- Assistant API integration
- Automatic token counting
- Cost estimation utilities

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/openai

# Or using npm
npm install @redux-ai/openai
```

## Usage

```typescript
import { createOpenAIProvider } from '@redux-ai/openai';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  // Optional configuration
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
  },
  rateLimiting: {
    tokensPerMinute: 90000,
    requestsPerMinute: 3500,
  },
});

// Use with Redux AI runtime
const runtime = createRuntime({
  provider,
  options: {
    debug: process.env.NODE_ENV === 'development',
  },
});

// Process messages
const response = await runtime.process([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
]);
```

## Function Calling

Implement function calling with type safety:

```typescript
import { defineFunction } from '@redux-ai/openai';

const searchProducts = defineFunction({
  name: 'search_products',
  description: 'Search for products in the catalog',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      category: {
        type: 'string',
        enum: ['electronics', 'books', 'clothing'],
      },
    },
    required: ['query'],
  },
});

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  functions: [searchProducts],
  functionCall: 'auto',
});
```

## Streaming Support

Handle streaming responses:

```typescript
const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  streaming: true,
  onToken: token => {
    console.log('Received token:', token);
  },
});

// Stream responses
await provider.complete(messages, {
  onProgress: partial => {
    console.log('Partial response:', partial);
  },
});
```

## Cost Management

Track and estimate API costs:

```typescript
import { estimateCost, TokenCounter } from '@redux-ai/openai';

// Estimate cost before making requests
const cost = estimateCost({
  model: 'gpt-4',
  messages: messages,
  maxTokens: 1000,
});

// Track actual usage
const counter = new TokenCounter();
counter.track(response);

console.log('Estimated cost:', cost);
console.log('Actual tokens used:', counter.total);
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
import { createMockOpenAI } from '@redux-ai/openai/testing';

const mockOpenAI = createMockOpenAI({
  responses: [{ content: 'Mock response 1' }, { content: 'Mock response 2' }],
});
```

## Error Handling

Handle OpenAI-specific errors:

```typescript
import { OpenAIError, RateLimitError } from '@redux-ai/openai';

try {
  await provider.complete(messages);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limit exceeded
  } else if (error instanceof OpenAIError) {
    // Handle other OpenAI-specific errors
  }
}
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
