import { configureStore } from '@reduxjs/toolkit';
import { render, renderHook, type RenderOptions } from '@testing-library/react';

// Set up fake IndexedDB
import 'fake-indexeddb/auto';

// Create a mock store
const mockStore = configureStore({
  reducer: {
    test: (_state = {}, _action) => _state,
  },
});

// Mock actions
const mockActions = {
  testAction: vi.fn(),
} as Record<string, unknown>;

// Create a minimal test actor factory
export const createTestActor = () => ({
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

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => ({
  ...render(ui, { wrapper: Wrapper, ...options }),
  mockStore,
});

const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderOptions, 'wrapper'>
) => renderHook(hook, { wrapper: Wrapper, ...options });

export { customRender as render, customRenderHook as renderHook, mockStore, mockActions, createTestActor };
export * from '@testing-library/react';