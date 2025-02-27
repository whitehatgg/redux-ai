import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { Type } from '@sinclair/typebox';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIState } from '../index';

describe('ReduxAIState', () => {
  let mockStore: Store;
  let mockStorage: any;
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
    mockStorage = {
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn().mockResolvedValue([]),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn().mockImplementation(() => () => undefined),
    };
  });

  // Create test actions schema with action validation
  const testActions = Type.Object({
    test: Type.Object({
      value: Type.Number(),
    }),
    type: Type.String(),
    payload: Type.Any(),
  });

  it('should initialize ReduxAIState with config', () => {
    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
    });

    expect(reduxAI).toBeDefined();
  });

  it('should process query and dispatch valid action', async () => {
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
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
    });

    const result = await reduxAI.processQuery('increment');
    expect(result.message).toBe('Incrementing counter');
    expect(result.action).toEqual({ type: 'test/increment' });
  });

  it('should reject invalid action format', async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          message: 'Incrementing counter',
          action: { invalid: 'format' }, // Missing required 'type' field
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
    });

    const result = await reduxAI.processQuery('increment');
    expect(result.message).toBe(
      "I couldn't create a valid action for that request. Could you rephrase it?"
    );
    expect(result.action).toBeNull();
  });

  it('should handle API errors', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    };
    vi.mocked(fetch).mockResolvedValue(mockErrorResponse as Response);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    const result = await reduxAI.processQuery('test query');
    expect(result).toEqual({
      message: 'I encountered an issue processing your request. Please try again.',
      action: null,
    });
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

    const result = await reduxAI.processQuery('test query');
    expect(result).toEqual({
      message: 'I encountered an issue processing your request. Please try again.',
      action: null,
    });
    expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
  });

  it('should handle invalid state structure', async () => {
    const invalidStore = configureStore({
      reducer: {
        test: (state = { invalidField: 'wrong type' }, action) => state,
      },
    });

    const reduxAI = createReduxAIState({
      store: invalidStore,
      storage: mockStorage,
      actions: testActions,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    const result = await reduxAI.processQuery('test query');
    expect(result.message).toBe(
      'I encountered an issue processing your request. Please try again.'
    );
    expect(result.action).toBeNull();
    expect(mockErrorHandler).toHaveBeenCalled();
  });
});
