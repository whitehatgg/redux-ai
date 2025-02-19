import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { ReduxAIProvider } from '../components/ReduxAIProvider';

// Mock vector creation
vi.mock('@redux-ai/vector', () => ({
  createReduxAIVector: vi.fn(() =>
    Promise.resolve({
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn(),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn(),
    })
  ),
}));

// Mock state creation
vi.mock('@redux-ai/state', () => ({
  createReduxAIState: vi.fn(() => Promise.resolve({})),
}));

// Create a mock store
const mockStore = configureStore({
  reducer: {
    test: (state = {}, action) => state,
  },
});

interface WrapperProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  return (
    <ReduxAIProvider store={mockStore} availableActions={[]}>
      {children}
    </ReduxAIProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';
export { customRender as render };
