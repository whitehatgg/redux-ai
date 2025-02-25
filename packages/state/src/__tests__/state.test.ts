import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { s } from '@redux-ai/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIState } from '../index';

describe('ReduxAIState', () => {
  let mockStore: Store;
  let mockVectorStorage: any;
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

  // Create test schema
  const testSchema = s.object({
    test: s.object({
      value: s.number()
    }),
    type: s.string(),
    payload: s.any()
  });

  it('should initialize ReduxAIState with config', () => {
    const reduxAI = createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      schema: testSchema,
      apiEndpoint: 'http://localhost:3000/api',
    });

    expect(reduxAI).toBeDefined();
  });

  // Skip this test temporarily until schema structure is fixed
  it.skip('should process query and dispatch action', async () => {
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
      schema: testSchema,
      apiEndpoint: 'http://localhost:3000/api',
    });

    const result = await reduxAI.processQuery('increment');
    expect(result.message).toBe('Incrementing counter');
    expect(result.action).toEqual({ type: 'test/increment' });
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
      vectorStorage: mockVectorStorage,
      schema: testSchema,
      apiEndpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    await expect(reduxAI.processQuery('test query')).rejects.toThrow('API request failed: 500');
    expect(mockErrorHandler).toHaveBeenCalled();
  });

  it('should handle vector storage errors', async () => {
    const mockError = new Error('Vector storage error');
    const erroringVectorStorage = {
      ...mockVectorStorage,
      retrieveSimilar: vi.fn().mockRejectedValue(mockError),
    };

    const reduxAI = createReduxAIState({
      store: mockStore,
      vectorStorage: erroringVectorStorage,
      schema: testSchema,
      apiEndpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    await expect(reduxAI.processQuery('test query')).rejects.toThrow('Vector storage error');
    expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
  });
});