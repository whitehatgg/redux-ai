import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { s } from 'ajv-ts';

import { ReduxAIProvider } from '../components/ReduxAIProvider';

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
    test: (_state = {}, _action) => _state,
  },
});

// Create a mock schema
const mockSchema = s.object({
  state: s.object({
    test: s.object({}).optional()
  }),
  actions: s.array(s.object({
    type: s.string(),
    payload: s.any()
  }))
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
      <ReduxAIProvider 
        store={mockStore} 
        schema={mockSchema}
        apiEndpoint="http://localhost:3000/api"
      >
        <div>Child content</div>
      </ReduxAIProvider>
    );

    expect(screen.getByText(/Initializing ReduxAI/i)).toBeDefined();
  });

  it('renders children when initialized', async () => {
    render(
      <ReduxAIProvider 
        store={mockStore}
        schema={mockSchema}
        apiEndpoint="http://localhost:3000/api"
      >
        <div data-testid="child">Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeDefined();
      expect(screen.getByText('Child content')).toBeDefined();
    });
  });

  it('handles initialization errors', async () => {
    const { createReduxAIVector } = await import('@redux-ai/vector');
    vi.mocked(createReduxAIVector).mockRejectedValueOnce(new Error('Initialization failed'));

    render(
      <ReduxAIProvider 
        store={mockStore}
        schema={mockSchema}
        apiEndpoint="http://localhost:3000/api"
      >
        <div>Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ReduxAI Initialization Error/i)).toBeDefined();
      expect(screen.getByText(/Initialization failed/i)).toBeDefined();
    });
  });
});