import { configureStore } from '@reduxjs/toolkit';
import { render, renderHook, type RenderOptions, type RenderResult } from '@testing-library/react';

// Set up fake IndexedDB
import 'fake-indexeddb/auto';

// Define proper types for the state and actions
type RootState = Record<string, unknown>;
type ActionType = 'TEST_ACTION' | string;

// Create a mock store with proper typing
const mockStore = configureStore<RootState>({
  reducer: {
    test: (_state = {}, _action) => _state,
  },
});

// Mock actions with proper typing
const mockActions = {
  testAction: vi.fn((payload?: unknown) => ({
    type: 'TEST_ACTION' as ActionType,
    payload,
  })),
} as const;

// Define proper types for the actor's state
interface ActorContext {
  messages: unknown[];
}

interface ActorSnapshot {
  value: string;
  context: ActorContext;
  matches: (value: string) => boolean;
  can: (event: string) => boolean;
  hasTag: (tag: string) => boolean;
  events: unknown[];
}

// Define proper types for the actor's events and responses
type ActorEvent = {
  type: string;
  [key: string]: unknown;
};

interface TestActor {
  getSnapshot: () => ActorSnapshot;
  logic: {
    getInitialSnapshot: () => ActorSnapshot;
  };
  start: () => void;
  stop: () => void;
  send: (event: ActorEvent) => void;
}

// Create a minimal test actor factory with proper typing
const createTestActor = (): TestActor => ({
  getSnapshot: () => ({
    value: 'idle',
    context: { messages: [] },
    matches: () => true,
    can: () => true,
    hasTag: () => false,
    events: []
  }),
  logic: {
    getInitialSnapshot: () => ({
      value: 'idle',
      context: { messages: [] },
      matches: () => true,
      can: () => true,
      hasTag: () => false,
      events: []
    })
  },
  start: () => {},
  stop: () => {},
  send: () => {}
});

interface WrapperProps {
  children: React.ReactNode;
}

function Wrapper({ children }: WrapperProps) {
  return children;
}

interface CustomRenderResult extends RenderResult {
  mockStore: typeof mockStore;
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): CustomRenderResult => {
  const renderResult = render(ui, { wrapper: Wrapper, ...options });
  return {
    ...renderResult,
    mockStore,
  };
};

const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderOptions, 'wrapper'>
) => renderHook(hook, { wrapper: Wrapper, ...options });

export { customRender as render, customRenderHook as renderHook, mockStore, mockActions };
export { createTestActor };
export type { TestActor, ActorSnapshot, ActorEvent, CustomRenderResult };
export * from '@testing-library/react';