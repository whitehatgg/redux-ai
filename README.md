# Install dependencies
pnpm install

# Build packages
pnpm build
```

## Usage

### Basic Setup

```typescript
import { ReduxAIProvider } from '@redux-ai/react';
import { configureStore } from '@reduxjs/toolkit';

// Your existing Redux store
const store = configureStore({
  reducer: rootReducer
});

// Define available actions for AI interpretation
const availableActions = [
  {
    type: 'users/filter',
    description: 'Filter users by search criteria',
    keywords: ['search', 'find', 'filter', 'users']
  }
];

const App = () => {
  return (
    <ReduxAIProvider
      store={store}
      availableActions={availableActions}
    >
      <YourApp />
    </ReduxAIProvider>
  );
};
```

### Adding Chat Interface

```typescript
import { ChatBubble, ActivityLog } from '@redux-ai/react';

const AppWithAI = () => {
  return (
    <div>
      <YourAppContent />

      {/* Add floating chat interface */}
      <ChatBubble className="fixed bottom-4 right-4" />

      {/* Optional: Add activity logging */}
      <ActivityLog />
    </div>
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

## Development

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @redux-ai/react build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @redux-ai/react test

# Run tests with coverage
pnpm test:coverage
```

### Type Checking

```bash
pnpm typecheck
```

### Code Style & Quality

We use ESLint and Prettier for code quality and formatting. Run these commands from the root:

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check