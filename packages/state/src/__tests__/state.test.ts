import type { ReduxAIVector } from '@redux-ai/vector';
import { configureStore } from '@reduxjs/toolkit';
import type { Store } from '@reduxjs/toolkit';
import { Type } from '@sinclair/typebox';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIState } from '../index';

describe('ReduxAIState', () => {
  let mockStore: Store;
  let mockStorage: ReduxAIVector;
  let mockErrorHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());

    mockStore = configureStore({
      reducer: {
        test: (state = { value: 0 }, action) => {
          switch (action.type) {
            case 'todos/increment':
              return { value: state.value + 1 };
            default:
              return state;
          }
        },
      },
    });

    mockErrorHandler = vi.fn();
    mockStorage = {
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn().mockResolvedValue([]),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn().mockImplementation(() => () => undefined),
    };
  });

  const testActions = Type.Object({
    todos: Type.Object({
      type: Type.Literal('todos/increment'),
      payload: Type.Optional(Type.Object({}, { additionalProperties: true })),
    }),
  });

  it('should process query and dispatch valid action', async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          intent: 'action',
          message: 'Incrementing counter',
          action: {
            type: 'todos/increment',
            todos: {
              type: 'todos/increment',
            },
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
    });

    const state = mockStore.getState();
    const result = await reduxAI.processQuery('increment');

    expect(result.message).toBe('Incrementing counter');
    expect(result.action).toEqual({
      type: 'todos/increment',
      todos: {
        type: 'todos/increment',
      },
    });

    // Verify proper storage interaction
    expect(mockStorage.storeInteraction).toHaveBeenCalledWith(
      'increment',
      'Incrementing counter',
      state
    );
  });

  it('should handle API errors', async () => {
    const mockErrorResponse = new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    await expect(reduxAI.processQuery('test query')).rejects.toThrow();
    expect(mockErrorHandler).toHaveBeenCalled();
  });

  it('should handle storage errors', async () => {
    const mockError = new Error('Storage error');
    const erroringStorage = {
      ...mockStorage,
      retrieveSimilar: vi.fn().mockRejectedValue(mockError),
    };

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: erroringStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    await expect(reduxAI.processQuery('test query')).rejects.toThrow('Storage error');
    expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
  });

  it('should handle invalid state structure', async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          message: 'Processing request',
          action: null,
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
    });

    const result = await reduxAI.processQuery('test query');
    expect(result.message).toBe('Processing request');
    expect(result.action).toBeNull();
  });
});
