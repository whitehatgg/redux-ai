import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIVector } from '../index';
import type { IndexedDBStorage } from '../indexeddb';
import { VectorStorage } from '../storage';

vi.mock('../storage');

describe('ReduxAIVector', () => {
  const mockStorage: Partial<IndexedDBStorage> = {
    addEntry: vi.fn(),
    retrieveSimilar: vi.fn(),
    getAllEntries: vi.fn(),
    storeInteraction: vi.fn(),
    subscribe: vi.fn(),
    initialize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    mockStorage.addEntry?.mockResolvedValue(undefined);
    mockStorage.retrieveSimilar?.mockResolvedValue([]);
    mockStorage.getAllEntries?.mockResolvedValue([]);
    mockStorage.storeInteraction?.mockResolvedValue(undefined);
    mockStorage.subscribe?.mockReturnValue(vi.fn());
    mockStorage.initialize?.mockResolvedValue(undefined);

    // Mock the static create method using spyOn
    vi.spyOn(VectorStorage, 'create').mockResolvedValue(mockStorage as IndexedDBStorage);
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

    // Setup mock for this specific test
    const mockEntry = { metadata: { query, response, state } };
    mockStorage.retrieveSimilar?.mockResolvedValueOnce([mockEntry]);

    await vector.storeInteraction(query, response, state);
    const similar = await vector.retrieveSimilar(query, 1);

    expect(mockStorage.storeInteraction).toHaveBeenCalledWith(query, response, state);
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
    expect(mockStorage.storeInteraction).toHaveBeenCalledWith('test', 'response', {});

    unsubscribe();
  });
});
