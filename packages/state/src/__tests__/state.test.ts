import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIState } from '../index';

interface TestState {
  test: {
    value: number;
  };
}

interface TestAction {
  type: 'test/increment';
  [key: string]: unknown;
}

describe('ReduxAIState', () => {
  let mockStore: Store<TestState>;
  let mockStorage: ReduxAIVector;
  let mockErrorHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch');

    mockStore = configureStore({
      reducer: {
        test: (state = { value: 0 }, action) => {
          if (action.type === 'test/increment') {
            return { value: state.value + 1 };
          }
          return state;
        },
      },
    });

    mockErrorHandler = vi.fn();
    mockStorage = {
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn().mockResolvedValue([]),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    };
  });

  it('should initialize successfully with valid config', () => {
    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: {} as Record<string, unknown>,
      endpoint: 'http://localhost:3000/api',
    });

    expect(reduxAI).toBeDefined();
  });

  it('should process query and dispatch action when API returns valid response', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        message: 'Success',
        action: { type: 'test/increment' },
        intent: 'action',
        reasoning: ['Test reasoning']
      }),
      { status: 200, statusText: 'OK' }
    );

    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: {} as Record<string, unknown>,
      endpoint: 'http://localhost:3000/api',
    });

    const result = await reduxAI.processQuery('increment counter');

    expect(result.message).toBe('Success');
    expect(result.action).toEqual({ type: 'test/increment' });
    expect(result.intent).toBe('action');
    expect(result.reasoning).toEqual(['Test reasoning']);
    expect(mockStore.getState().test.value).toBe(1);
  });

  it('should handle invalid response gracefully', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        message: 'Error processing request',
        action: null,
        intent: 'conversation',
        reasoning: []
      }),
      { status: 200, statusText: 'OK' }
    );

    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: {} as Record<string, unknown>,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    const result = await reduxAI.processQuery('invalid query');

    expect(result.message).toBe('Error processing request');
    expect(result.action).toBeNull();
    expect(result.intent).toBe('conversation');
    expect(mockStore.getState().test.value).toBe(0);
  });

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(fetch).mockRejectedValue(mockError);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: {} as Record<string, unknown>,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    try {
      await reduxAI.processQuery('test query');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBe(mockError);
      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
    }
  });

  it('should handle storage errors gracefully', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        message: 'Success',
        action: { type: 'test/increment' },
        intent: 'action',
        reasoning: ['Test reasoning']
      }),
      { status: 200, statusText: 'OK' }
    );

    const mockError = new Error('Storage error');
    vi.mocked(fetch).mockResolvedValue(mockResponse);
    mockStorage.storeInteraction = vi.fn().mockRejectedValue(mockError);

    const reduxAI = createReduxAIState({
      store: mockStore,
      storage: mockStorage,
      actions: {} as Record<string, unknown>,
      endpoint: 'http://localhost:3000/api',
      onError: mockErrorHandler,
    });

    try {
      await reduxAI.processQuery('test query');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBe(mockError);
      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
    }
  });
});
