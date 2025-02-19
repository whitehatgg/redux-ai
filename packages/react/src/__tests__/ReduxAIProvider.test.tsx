import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReduxAIProvider } from '../components/ReduxAIProvider';
import { configureStore } from '@reduxjs/toolkit';

// Mock vector creation
vi.mock('@redux-ai/vector', () => ({
  createReduxAIVector: vi.fn(() =>
    Promise.resolve({
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn(),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
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

describe('ReduxAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <ReduxAIProvider store={mockStore} availableActions={[]}>
        <div>Child content</div>
      </ReduxAIProvider>
    );

    expect(screen.getByText(/Initializing ReduxAI/i)).toBeInTheDocument();
  });

  it('renders children when initialized', async () => {
    render(
      <ReduxAIProvider store={mockStore} availableActions={[]}>
        <div data-testid="child">Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  it('handles initialization errors', async () => {
    const { createReduxAIVector } = await import('@redux-ai/vector');
    vi.mocked(createReduxAIVector).mockRejectedValueOnce(new Error('Initialization failed'));

    render(
      <ReduxAIProvider 
        store={mockStore} 
        availableActions={[]}
        forceError="Initialization failed"
      >
        <div>Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ReduxAI Initialization Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Initialization failed/i)).toBeInTheDocument();
    });
  });
});