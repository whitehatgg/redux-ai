# @redux-ai/runtime

Core runtime engine for Redux AI toolkit that provides base functionality and utilities for AI-powered state management.

## Features

- Base runtime utilities for Redux AI toolkit
- Type-safe integration points for AI providers
- Core state management primitives
- Extensible provider system for LLM integrations
- Built-in testing utilities and mocks
- Standardized error handling
- Provider-agnostic abstractions

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/runtime

# Or using npm
npm install @redux-ai/runtime
```

## Usage

```typescript
import { createRuntime, type RuntimeConfig } from '@redux-ai/runtime';
import type { LLMProvider } from '@redux-ai/runtime';

// Create a runtime instance
const runtime = createRuntime({
  provider: yourLLMProvider,
  options: {
    // Runtime-specific options
    maxRetries: 3,
    timeout: 30000,
    debug: process.env.NODE_ENV === 'development',
  },
});

// Example provider implementation
class CustomProvider implements LLMProvider {
  async complete(
    messages: Message[],
    state?: Record<string, unknown>
  ): Promise<CompletionResponse> {
    // Your provider implementation
    return {
      message: 'Response from custom provider',
      action: { type: 'CUSTOM_ACTION' },
    };
  }
}
```

## Provider Interface

Implement the `LLMProvider` interface to create custom providers:

```typescript
interface LLMProvider {
  complete(
    messages: Message[],
    currentState?: Record<string, unknown>
  ): Promise<CompletionResponse>;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionResponse {
  message: string;
  action: { type: string } | null;
}
```

## Testing

The package includes comprehensive testing utilities:

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Test Utilities

```typescript
import { createMockProvider } from '@redux-ai/runtime/testing';

// Create a mock provider for testing
const mockProvider = createMockProvider({
  responses: [
    {
      message: 'Mock response',
      action: { type: 'TEST_ACTION' },
    },
  ],
});

// Use in tests
const runtime = createRuntime({ provider: mockProvider });
const result = await runtime.process([{ role: 'user', content: 'Test message' }]);
```

## Error Handling

The runtime provides standardized error types:

```typescript
import { RuntimeError, ProviderError } from '@redux-ai/runtime';

try {
  await runtime.process(messages);
} catch (error) {
  if (error instanceof ProviderError) {
    // Handle provider-specific errors
  } else if (error instanceof RuntimeError) {
    // Handle runtime errors
  }
}
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
