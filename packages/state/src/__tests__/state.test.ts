import type { ReduxAIVector } from '@redux-ai/vector';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIState } from '../index';
import type { ReduxAIAction } from '../index';

describe('ReduxAIState', () => {
  const mockStore = configureStore({
    reducer: {
      test: (state = { value: 0 }, action) => {
        switch (action.type) {
          case 'test/increment':
            return { value: state.value + 1 };
          default:
            return state;
        }
      },
    },
  });

  const mockAvailableActions: ReduxAIAction[] = [
    {
      type: 'test/increment',
      description: 'Increment the counter',
      keywords: ['increment', 'increase', 'add'],
    },
  ];

  const mockVectorStorage: ReduxAIVector = {
    addEntry: vi.fn(),
    retrieveSimilar: vi.fn().mockResolvedValue([]),
    getAllEntries: vi.fn(),
    storeInteraction: vi.fn(),
    subscribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should initialize ReduxAIState with config', async () => {
    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      availableActions: mockAvailableActions,
      forceNewInstance: true,
    });

    expect(reduxAI).toBeDefined();
  });

  it('should process query and dispatch action', async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          message: 'Incrementing counter',
          action: { type: 'test/increment' },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      availableActions: mockAvailableActions,
      forceNewInstance: true,
    });

    const result = await reduxAI.processQuery('increment the counter');
    expect(result.message).toBe('Incrementing counter');
    expect(result.action).toEqual({ type: 'test/increment' });
  });

  it('should handle API errors gracefully', async () => {
    const mockErrorHandler = vi.fn();
    const mockErrorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Internal Server Error'),
    };
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse as Response);

    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      availableActions: mockAvailableActions,
      onError: mockErrorHandler,
      forceNewInstance: true,
    });

    await expect(reduxAI.processQuery('increment')).rejects.toThrow('API request failed: 500');
    expect(mockErrorHandler).toHaveBeenCalled();
    expect(mockErrorHandler.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockErrorHandler.mock.calls[0][0].message).toContain('API request failed: 500');
  });

  it('should handle vector storage errors', async () => {
    const mockErrorHandler = vi.fn();
    const mockVectorError = new Error('Vector storage error');
    const erroringVectorStorage: ReduxAIVector = {
      ...mockVectorStorage,
      retrieveSimilar: vi.fn().mockRejectedValue(mockVectorError),
    };

    const mockSuccessResponse = {
      ok: true,
      json: () => Promise.resolve({ message: 'Success', action: null }),
    };
    vi.mocked(fetch).mockResolvedValue(mockSuccessResponse as Response);

    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: erroringVectorStorage,
      availableActions: mockAvailableActions,
      onError: mockErrorHandler,
      forceNewInstance: true,
    });

    await reduxAI.processQuery('test query');
    expect(mockErrorHandler).toHaveBeenCalledWith(mockVectorError);
  });
});
