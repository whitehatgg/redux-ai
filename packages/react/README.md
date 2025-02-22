# @redux-ai/react

React components and hooks for the Redux AI state management system, providing debugging and visualization tools.

## Features

- Debug components for Redux state inspection
- Vector similarity search visualization
- Real-time activity logging
- Custom hooks for vector storage access
- AI-powered state inspection tools
- TypeScript-first component library

## Installation

```bash
pnpm add @redux-ai/react
```

## Usage

```typescript
import {
  ReduxAIProvider,
  VectorDebugger,
  ActivityLog,
  useVectorDebug
} from '@redux-ai/react';

// Wrap your app with the provider
const App = () => {
  return (
    <ReduxAIProvider
      store={store}
      availableActions={[
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
    search
  } = useVectorDebug();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <SearchBar onSearch={search} />
      <VectorList entries={entries} />
    </div>
  );
};
```

## Components

### `<ReduxAIProvider>`

Provides Redux AI context to your application.

#### Props

- `store` (Store) - Redux store instance
- `availableActions` (Action[]) - List of available actions
- `config` (ProviderConfig) - Optional configuration

### `<VectorDebugger>`

Displays available actions and their metadata.

#### Props

- `onActionSelect` (function) - Callback for action selection
- `filter` (object) - Filter settings for actions
- `layout` ('list' | 'grid') - Display layout

### `<ActivityLog>`

Shows real-time logging of vector operations.

#### Props

- `filter` ('all' | 'error' | 'warning') - Log level filter
- `maxEntries` (number) - Maximum entries to display
- `onClear` (function) - Callback for clearing logs

### `<StateInspector>`

Visual inspector for Redux state.

#### Props

- `path` (string) - State path to inspect
- `diff` (boolean) - Show state differences
- `theme` (object) - Custom theme settings

## Hooks

### `useVectorDebug()`

Hook for accessing vector storage data.

#### Returns

- `entries` - Vector entries
- `isLoading` - Loading state
- `error` - Error state
- `search` - Search function
- `clear` - Clear entries function

### `useAIActions()`

Hook for accessing AI-suggested actions.

#### Returns

- `suggestions` - Current action suggestions
- `confidence` - Confidence scores
- `refresh` - Refresh suggestions function

### `useStatePredictor()`

Hook for state prediction functionality.

#### Returns

- `predict` - Prediction function
- `results` - Prediction results
- `accuracy` - Prediction accuracy

## Styling

The components come with default styling and support customization through:

- CSS variables for theming
- Tailwind CSS classes
- Style prop for inline styles
- className prop for custom classes

## TypeScript Support

All components and hooks are fully typed, providing:

- Prop type checking
- Generic type parameters
- Type inference
- Autocomplete support
