# @redux-ai/runtime

Core runtime engine for Redux AI toolkit that provides base functionality and utilities for AI-powered state management.

## Features

- Base runtime utilities for Redux AI toolkit
- Advanced chain-of-thought reasoning system
- Comprehensive activity logging
- Type-safe integration points for AI providers
- Core state management primitives
- Extensible provider system for LLM integrations
- Built-in testing utilities and mocks
- Direct error propagation with original LLM messages
- Provider-agnostic abstractions

## Recent Improvements

### Enhanced Chain-of-Thought Reasoning
- Structured reasoning format for all operations
- Multi-step workflow detection and processing
- Step-by-step workflow execution with context preservation
- Comprehensive intent tracking and analysis

### Direct Error Propagation
- Raw error messages from LLMs preserved
- No message transformation or wrapping
- Original context maintained for debugging
- Standardized HTTP status codes

### Advanced Workflow Intent
- Automatic multi-step query detection
- Dynamic workflow step splitting
- Context preservation between steps
- Intent-based routing (action/state/conversation)

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
      intent: 'action',
      reasoning: [
        'Initial observation: Analyzing request context',
        'Analysis: Processing request parameters',
        'Decision: Generate appropriate response'
      ]
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
  reasoning: string[];
  intent: 'action' | 'state' | 'conversation' | 'workflow';
  workflow?: CompletionResponse[]; // For multi-step operations
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
      message: 'Mock response with reasoning',
      action: { type: 'TEST_ACTION' },
      intent: 'action',
      reasoning: [
        'Initial observation: Analyzing test request',
        'Analysis: Processing test parameters',
        'Decision: Generate test response'
      ]
    },
  ],
});

// Use in tests
const runtime = createRuntime({ provider: mockProvider });
const result = await runtime.process([
  { role: 'user', content: 'Test message' }
]);
```

## Error Handling

The runtime provides direct error propagation from LLMs:

```typescript
import { createRuntime } from '@redux-ai/runtime';

try {
  await runtime.process(messages);
} catch (error) {
  // Error message is preserved directly from the LLM
  console.error('LLM Error:', error.message);
  // HTTP status codes are standardized but messages are unchanged
  if (error.message.toLowerCase().includes('api key')) {
    // Handle 401 Unauthorized
  } else if (error.message.toLowerCase().includes('rate limit')) {
    // Handle 429 Too Many Requests
  }
}
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT