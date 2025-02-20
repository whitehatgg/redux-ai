import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIVector } from '../index';
import { VectorStorage } from '../storage';
import type { VectorEntry } from '../types';

vi.mock('../storage');

describe('ReduxAIVector', () => {
  const mockStorage: Partial<VectorStorage> = {
    addEntry: vi.fn(),
    retrieveSimilar: vi.fn(),
    getAllEntries: vi.fn(),
    storeInteraction: vi.fn(),
    subscribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    (mockStorage.addEntry as any).mockResolvedValue(undefined);
    (mockStorage.retrieveSimilar as any).mockResolvedValue([]);
    (mockStorage.getAllEntries as any).mockResolvedValue([]);
    (mockStorage.storeInteraction as any).mockResolvedValue(undefined);
    (mockStorage.subscribe as any).mockReturnValue(vi.fn());

    // Mock the static create method
    vi.spyOn(VectorStorage, 'create').mockResolvedValue(mockStorage as VectorStorage);
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

    // Setup mock for this specific test with complete VectorEntry properties
    const mockEntry: VectorEntry = {
      id: '123',
      vector: new Array(128).fill(0),
      timestamp: Date.now(),
      metadata: { query, response, state },
    };

    (mockStorage.retrieveSimilar as any).mockResolvedValueOnce([mockEntry]);

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
