# @redux-ai/langchain

LangChain integration for Redux AI toolkit, providing advanced language model capabilities and chain operations.

## Features

- LangChain integration with Redux state management
- Pre-built chains for common AI operations
- Type-safe chain builders
- Memory and context management
- Custom chain composition utilities
- Streaming response support
- Integration with popular LangChain models

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/langchain

# Or using npm
npm install @redux-ai/langchain
```

## Usage

```typescript
import { createLangChainProvider } from '@redux-ai/langchain';
import { ChatOpenAI } from 'langchain/chat_models/openai';

const provider = createLangChainProvider({
  model: new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
  }),
  // Additional configuration
  memory: {
    type: 'buffer',
    capacity: 10,
  },
  streaming: true,
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

## Chain Building

Create custom chains for specialized processing:

```typescript
import { createChain, ChainType } from '@redux-ai/langchain';

const summarizationChain = createChain({
  type: ChainType.Sequential,
  steps: [
    {
      name: 'extract',
      prompt: 'Extract key points from the following text: {input}',
    },
    {
      name: 'summarize',
      prompt: 'Create a concise summary from these points: {extract}',
    },
  ],
});

// Use the chain
const result = await summarizationChain.run({
  input: 'Your long text here...',
});
```

## Memory Management

Configure different memory types:

```typescript
import { MemoryType } from '@redux-ai/langchain';

const provider = createLangChainProvider({
  model: new ChatOpenAI(),
  memory: {
    type: MemoryType.Buffer,
    capacity: 5,
    relevanceThreshold: 0.7,
  },
});
```

## Streaming Support

Handle streaming responses:

```typescript
const provider = createLangChainProvider({
  model: new ChatOpenAI(),
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
import { createMockChain } from '@redux-ai/langchain/testing';

const mockChain = createMockChain({
  responses: [{ output: 'Mock response 1' }, { output: 'Mock response 2' }],
});
```

## Error Handling

The package provides specialized error types:

```typescript
import { LangChainError, ChainError } from '@redux-ai/langchain';

try {
  await chain.run(input);
} catch (error) {
  if (error instanceof ChainError) {
    // Handle chain-specific errors
  } else if (error instanceof LangChainError) {
    // Handle general LangChain errors
  }
}
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
