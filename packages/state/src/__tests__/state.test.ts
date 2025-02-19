import type { ReduxAIVector } from '@redux-ai/vector';
import { configureStore } from '@reduxjs/toolkit';

import { createReduxAIState } from '../index';
import type { ReduxAIAction } from '../index';

jest.mock('node-fetch');

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
    addEntry: jest.fn(),
    retrieveSimilar: jest.fn(),
    getAllEntries: jest.fn(),
    storeInteraction: jest.fn(),
    subscribe: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('should initialize ReduxAIState with config', async () => {
    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      availableActions: mockAvailableActions,
    });

    expect(reduxAI).toBeDefined();
  });

  it('should process query and dispatch action', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'Incrementing counter',
            action: { type: 'test/increment' },
          }),
      })
    );

    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      availableActions: mockAvailableActions,
    });

    const result = await reduxAI.processQuery('increment the counter');
    expect(result.message).toBe('Incrementing counter');
    expect(result.action).toEqual({ type: 'test/increment' });
    expect(mockVectorStorage.storeInteraction).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        statusText: 'Internal Server Error',
      })
    );

    const mockErrorHandler = jest.fn();
    const reduxAI = await createReduxAIState({
      store: mockStore,
      vectorStorage: mockVectorStorage,
      availableActions: mockAvailableActions,
      onError: mockErrorHandler,
    });

    await expect(reduxAI.processQuery('increment')).rejects.toThrow();
    expect(mockErrorHandler).toHaveBeenCalled();
  });
});
