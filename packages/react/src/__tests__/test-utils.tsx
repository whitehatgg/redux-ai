import React, { type ReactElement, useState, useEffect } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { act } from 'react';

// Create and export mock hooks
export const mockUseReduxAI = vi.fn().mockReturnValue({
  sendQuery: vi.fn(),
  isProcessing: false,
  error: null,
});

export const mockVectorStorage = {
  subscribe: vi.fn(() => vi.fn()),
  getAllEntries: vi.fn().mockResolvedValue([]),
  storeInteraction: vi.fn(),
};

export const mockUseReduxAIContext = vi.fn().mockReturnValue({
  vectorStorage: mockVectorStorage,
  isInitialized: true,
  availableActions: [],
});

// Mock ReduxAIProvider component
interface MockReduxAIProviderProps {
  children: React.ReactNode;
  store: any;
  availableActions: any[];
  forceError?: string;
  initDelay?: number;
}

const MockReduxAIProvider: React.FC<MockReduxAIProviderProps> = ({ 
  children, 
  forceError,
  initDelay = 100 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | undefined>(forceError);

  useEffect(() => {
    if (forceError) {
      setError(forceError);
      return;
    }

    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, initDelay);

    return () => clearTimeout(timer);
  }, [forceError, initDelay]);

  if (!isInitialized && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Initializing ReduxAI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md space-y-4 p-4 text-center">
          <p className="font-medium text-destructive">ReduxAI Initialization Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Mock the modules
vi.mock('../hooks/useReduxAI', () => ({
  useReduxAI: () => mockUseReduxAI(),
}));

vi.mock('../components/ReduxAIProvider', () => ({
  ReduxAIProvider: MockReduxAIProvider,
  useReduxAIContext: () => mockUseReduxAIContext(),
}));

// Create a mock store
const mockStore = configureStore({
  reducer: {
    test: (state = {}, action) => state,
  },
});

// Setup DOM mocks
beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }
});

interface WrapperProps {
  children: React.ReactNode;
}

function Wrapper({ children }: WrapperProps) {
  return <MockReduxAIProvider store={mockStore} availableActions={[]}>{children}</MockReduxAIProvider>;
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    mockStore,
  };
};

const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return renderHook(hook, {
    wrapper: Wrapper,
    ...options,
  });
};

// Helper to wait for all state updates
const waitForStateUpdates = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 150));
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook, waitForStateUpdates };