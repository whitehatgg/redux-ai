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
- 🔄 Direct LLM message display
- ❌ Transparent error propagation

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/react

# Or using npm
npm install @redux-ai/react
```

## Usage

```typescript
import { ReduxAIProvider } from '@redux-ai/react';
import { useDispatch, useSelector } from 'react-redux';
import { createWorkflowMiddleware } from '@redux-ai/state';

// Set up store with workflow middleware
const workflowMiddleware = createWorkflowMiddleware();

const store = configureStore({
  reducer: {
    // Your reducers here
  },
  middleware: (getDefault) => 
    getDefault().concat(workflowMiddleware)
});

// Wrap your app with the provider
function App() {
  return (
    <ReduxAIProvider>
      <YourAppComponents />
    </ReduxAIProvider>
  );
}

// Use in your components
function Counter() {
  const dispatch = useDispatch();
  const count = useSelector((state: RootState) => state.counter.value);

  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => dispatch({ type: 'counter/increment' })}>
        Increment
      </button>
    </div>
  );
}
```

## Components

### `<ReduxAIProvider>`

Root provider component that sets up the Redux AI context.

#### Props

- `children` (ReactNode) - Child components to wrap
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

## Testing

```typescript
import {
  createMockStore,
  renderWithProvider,
  mockVectorStorage
} from '@redux-ai/react/testing';

// Create a mock store
const store = createMockStore({
  initialState: {
    counter: { value: 0 }
  }
});

// Render with provider
const { getByText } = renderWithProvider(
  <Counter />,
  {
    store,
    vectorStorage: mockVectorStorage()
  }
);
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT