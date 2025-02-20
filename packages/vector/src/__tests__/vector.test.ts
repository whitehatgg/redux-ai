// vi.mock must be at the top level
vi.mock('../storage', () => {
  const mockState = {
    entries: [] as any[],
    spies: {
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn(),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn(),
      initialize: vi.fn(),
    },
  };

  // Setup spy implementations
  mockState.spies.addEntry.mockImplementation((entry) => {
    mockState.entries.push(entry);
    return Promise.resolve();
  });

  mockState.spies.retrieveSimilar.mockImplementation(() =>
    Promise.resolve(mockState.entries)
  );

  mockState.spies.getAllEntries.mockImplementation(() =>
    Promise.resolve(mockState.entries)
  );

  mockState.spies.storeInteraction.mockImplementation((query, response, state) => {
    mockState.entries.push({ metadata: { query, response, state } });
    return Promise.resolve();
  });

  mockState.spies.subscribe.mockImplementation(() => vi.fn());
  mockState.spies.initialize.mockResolvedValue(undefined);

  // Export mockState so tests can access it
  (global as any).__vectorMockState = mockState;

  return {
    VectorStorage: {
      create: vi.fn().mockImplementation(() => mockState.spies),
    },
  };
});

import { describe, expect, it, vi } from 'vitest';
import { createReduxAIVector } from '../index';
import { VectorStorage } from '../storage';
import type { IndexedDBStorage } from '../indexeddb';

// Get mock state from global
const mockState = (global as any).__vectorMockState;

describe('ReduxAIVector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.entries.length = 0; // Clear entries array
  });

  it('should create a vector instance', async () => {
    const vector = await createReduxAIVector();
    expect(vector).toBeDefined();
    expect(VectorStorage.create).toHaveBeenCalled();
  });

  it('should store and retrieve interactions', async () => {
    const vector = await createReduxAIVector();
    const query = 'test query';
    const response = 'test response';
    const state = { test: 'state' };

    await vector.storeInteraction(query, response, state);
    const similar = await vector.retrieveSimilar(query, 1);

    expect(mockState.spies.storeInteraction).toHaveBeenCalledWith(query, response, state);
    expect(similar).toHaveLength(1);
    expect(similar[0].metadata).toEqual({
      query,
      response,
      state,
    });
  });

  it('should handle subscription events', async () => {
    const vector = await createReduxAIVector();
    const callback = vi.fn();

    const unsubscribe = vector.subscribe(callback);
    expect(typeof unsubscribe).toBe('function');

    await vector.storeInteraction('test', 'response', {});
    expect(mockState.spies.storeInteraction).toHaveBeenCalledWith('test', 'response', {});

    unsubscribe();
  });
});