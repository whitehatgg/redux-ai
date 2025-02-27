import { configureStore } from '@reduxjs/toolkit';
import { Type } from '@sinclair/typebox';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// Create a mock store
const mockStore = configureStore({
  reducer: {
    test: (_state = {}, _action) => _state,
  },
});

// Create a mock action schema
const mockActions = Type.Object({
  type: Type.String(),
  payload: Type.Any(),
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
      <ReduxAIProvider store={mockStore} actions={mockActions} endpoint="/api/ai">
        <div>Child content</div>
      </ReduxAIProvider>
    );

    expect(screen.getByText(/Initializing ReduxAI/i)).toBeDefined();
  });

  it('renders children when initialized', async () => {
    render(
      <ReduxAIProvider store={mockStore} actions={mockActions} endpoint="/api/ai">
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
      <ReduxAIProvider store={mockStore} actions={mockActions} endpoint="/api/ai">
        <div>Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ReduxAI Initialization Error/i)).toBeDefined();
      expect(screen.getByText(/Initialization failed/i)).toBeDefined();
    });
  });
});
