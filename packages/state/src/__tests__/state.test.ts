import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIState } from '../index';
import type { ReduxAIAction } from '../index';

describe('ReduxAIState', () => {
  let mockStore: Store;
  let mockVectorStorage: ReduxAIVector;
  let mockErrorHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());

    mockStore = configureStore({
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

    mockErrorHandler = vi.fn();
    mockVectorStorage = {
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn().mockResolvedValue([]),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn().mockImplementation(() => () => undefined),
    };
  });

  const mockActions: ReduxAIAction[] = [
    {
      type: 'test/increment',
      description: 'Increment the counter',
      keywords: ['increment', 'increase', 'add'],
    },
  ];

  it('should initialize ReduxAIState with config', () => {
    const reduxAI = createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      actions: mockActions,
      apiEndpoint: 'http://localhost:3000/api',
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

    const reduxAI = createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      actions: mockActions,
      apiEndpoint: 'http://localhost:3000/api',
    });

    const result = await reduxAI.processQuery('increment the counter');
    expect(result.message).toBe('Incrementing counter');
    expect(result.action).toEqual({ type: 'test/increment' });
  });

  it('should handle API errors gracefully', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Internal Server Error'),
    };
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse as Response);

    const reduxAI = createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      actions: mockActions,
      apiEndpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    await expect(reduxAI.processQuery('increment')).rejects.toThrow('API request failed: 500');
    expect(mockErrorHandler).toHaveBeenCalled();
    expect(mockErrorHandler.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockErrorHandler.mock.calls[0][0].message).toContain('API request failed: 500');
  });

  it('should handle vector storage errors', async () => {
    expect.assertions(2); // Ensure both assertions are called

    const mockError = new Error('Vector storage error');
    const erroringVectorStorage = {
      ...mockVectorStorage,
      retrieveSimilar: vi.fn().mockRejectedValue(mockError),
    };

    const successResponse = {
      ok: true,
      json: () => Promise.resolve({ message: 'Success', action: null }),
    };
    vi.mocked(fetch).mockResolvedValue(successResponse as Response);

    const reduxAI = createReduxAIState({
      store: mockStore,
      vectorStorage: erroringVectorStorage,
      actions: mockActions,
      apiEndpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    try {
      await reduxAI.processQuery('test query');
    } catch (error) {
      // Error is expected, but we want to verify error handler was called
      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
      expect(mockError.message).toBe('Vector storage error');
    }
  });
});
