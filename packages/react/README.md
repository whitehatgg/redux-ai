# @redux-ai/react

React components and hooks for the Redux AI state management system, providing debugging and visualization tools.

## Features

- 🔍 Debug components for Redux state inspection
- 📊 Vector similarity search visualization
- 📝 Real-time activity logging with filtering
- 🎣 Custom hooks for vector storage access
- 🤖 AI-powered state inspection tools
- 💎 TypeScript-first component library
- 🎨 Theme-aware components with Tailwind CSS
- ♿ Accessibility-first design

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/react

# Or using npm
npm install @redux-ai/react
```

## Key Dependencies

- React 18.x
- Redux Toolkit 2.x
- TanStack Query 5.x
- Radix UI Components
- Tailwind CSS

## Usage

```typescript
import {
  ReduxAIProvider,
  VectorDebugger,
  ActivityLog,
  useVectorDebug,
  useAIActions
} from '@redux-ai/react';

// Wrap your app with the provider
const App = () => {
  return (
    <ReduxAIProvider
      store={store}
      actions={[
        {
          type: 'users/add',
          description: 'Add a new user',
          keywords: ['user', 'create', 'add'],
          metadata: {
            category: 'User Management',
            importance: 'high'
          }
        }
      ]}
    >
      <YourApp />
      <DebugPanel />
    </ReduxAIProvider>
  );
};

// Create a debug panel with visualization
const DebugPanel = () => {
  return (
    <div className="debug-panel">
      <VectorDebugger
        onActionSelect={(action) => {
          console.log('Selected action:', action);
        }}
      />
      <ActivityLog
        filter="error"
        maxEntries={50}
      />
      <StateInspector />
    </div>
  );
};

// Use hooks in your components
const VectorViewer = () => {
  const {
    entries,
    isLoading,
    search,
    refresh
  } = useVectorDebug();

  const { suggestions, confidence } = useAIActions();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <SearchBar onSearch={search} />
      <VectorList entries={entries} />
      <AIActionSuggestions
        suggestions={suggestions}
        confidence={confidence}
      />
    </div>
  );
};
```

## Components

### `<ReduxAIProvider>`

Root provider component that sets up the Redux AI context.

#### Props

- `store` (Store) - Redux store instance
- `actions` (Action[]) - List of available actions
- `config` (ProviderConfig) - Optional configuration
- `theme` (ThemeConfig) - Optional theme overrides

### `<VectorDebugger>`

Interactive visualization of vector storage and actions.

#### Props

- `onActionSelect` (function) - Callback for action selection
- `filter` (object) - Filter settings for actions
- `layout` ('list' | 'grid') - Display layout
- `className` (string) - Optional CSS class

### `<ActivityLog>`

Real-time logging with filtering capabilities.

#### Props

- `filter` ('all' | 'error' | 'warning') - Log level filter
- `maxEntries` (number) - Maximum entries to display
- `onClear` (function) - Callback for clearing logs
- `className` (string) - Optional CSS class

### `<StateInspector>`

Visual inspector for Redux state with diff view.

#### Props

- `path` (string) - State path to inspect
- `diff` (boolean) - Show state differences
- `theme` (object) - Custom theme settings
- `className` (string) - Optional CSS class

## Hooks

### `useVectorDebug()`

Hook for accessing and managing vector storage.

#### Returns

- `entries` - Vector entries array
- `isLoading` - Loading state boolean
- `error` - Error state object
- `search` - Search function
- `refresh` - Refresh entries function
- `clear` - Clear entries function

### `useAIActions()`

Hook for AI-suggested actions with confidence scores.

#### Returns

- `suggestions` - Current action suggestions
- `confidence` - Confidence scores per suggestion
- `refresh` - Refresh suggestions function
- `execute` - Execute suggested action

### `useStatePredictor()`

Hook for state prediction and analysis.

#### Returns

- `predict` - Prediction function
- `results` - Prediction results
- `accuracy` - Prediction accuracy
- `confidence` - Confidence metrics

## Styling

Components support customization through:

- CSS variables for theming
- Tailwind CSS classes
- Style prop for inline styles
- className prop for custom classes

### Default Theme

```css
:root {
  --ai-primary: #0ea5e9;
  --ai-secondary: #0f172a;
  --ai-accent: #f97316;
  --ai-background: #ffffff;
  --ai-foreground: #0f172a;
}
```

## TypeScript Support

Full TypeScript support with:

- Strict type checking
- Generic type parameters
- Type inference
- Autocomplete support
- Proper component prop types

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Test Utilities

```typescript
import {
  createMockStore,
  renderWithProvider,
  mockVectorStorage
} from '@redux-ai/react/testing';

// Create a mock store
const store = createMockStore({
  initialState: {
    users: []
  }
});

// Render with vector storage mock
const { getByText } = renderWithProvider(
  <VectorDebugger />,
  {
    store,
    vectorStorage: mockVectorStorage({
      entries: [/* mock entries */]
    })
  }
);
```

## Error Handling

```typescript
import { AIComponentError } from '@redux-ai/react';

try {
  // Component logic
} catch (error) {
  if (error instanceof AIComponentError) {
    console.error('AI Component Error:', error.message);
    // Handle component-specific errors
  }
}
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
