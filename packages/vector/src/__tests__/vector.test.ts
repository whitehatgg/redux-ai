import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReduxAIVector } from '../index';
import { VectorStorage } from '../storage';
import type { VectorEntry } from '../types';

describe('ReduxAIVector', () => {
  let mockStorage: VectorStorage;
  let unsubscribeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    unsubscribeSpy = vi.fn();

    // Create a mock vector storage instance
    mockStorage = {
      addEntry: vi.fn().mockResolvedValue(undefined),
      retrieveSimilar: vi.fn().mockResolvedValue([]),
      getAllEntries: vi.fn().mockResolvedValue([]),
      storeInteraction: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockImplementation(() => unsubscribeSpy),
    } as unknown as VectorStorage;

    // Mock the static create method
    vi.spyOn(VectorStorage, 'create').mockResolvedValue(mockStorage);
  });

  it('should create a vector instance with default config', async () => {
    const vector = await createReduxAIVector();
    expect(vector).toBeDefined();
    expect(VectorStorage.create).toHaveBeenCalledWith({
      dimensions: 128,
      collectionName: 'reduxai_vector',
      maxEntries: 100,
    });
  });

  it('should store and retrieve interactions', async () => {
    const vector = await createReduxAIVector();
    const query = 'test query';
    const response = 'test response';

    const mockEntry: VectorEntry = {
      id: '123',
      vector: new Array(128).fill(0),
      timestamp: Date.now(),
      metadata: { query, response },
    };

    mockStorage.retrieveSimilar.mockResolvedValueOnce([mockEntry]);

    await vector.storeInteraction(query, response);
    const similar = await vector.retrieveSimilar(query, 1);

    expect(mockStorage.storeInteraction).toHaveBeenCalledWith(query, response);
    expect(similar).toHaveLength(1);
    expect(similar[0].metadata).toEqual({
      query,
      response,
    });
  });

  it('should handle subscription events', async () => {
    const vector = await createReduxAIVector();
    const callback = vi.fn();

    const unsubscribe = vector.subscribe(callback);
    expect(typeof unsubscribe).toBe('function');

    await vector.storeInteraction('test', 'response');
    expect(mockStorage.storeInteraction).toHaveBeenCalledWith('test', 'response');

    unsubscribe();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should handle storage initialization errors', async () => {
    const error = new Error('Initialization failed');
    vi.spyOn(VectorStorage, 'create').mockRejectedValueOnce(error);

    await expect(createReduxAIVector()).rejects.toThrow('Initialization failed');
  });

  it('should handle storage operation errors', async () => {
    const vector = await createReduxAIVector();
    const error = new Error('Storage operation failed');

    mockStorage.storeInteraction.mockRejectedValueOnce(error);
    await expect(vector.storeInteraction('test', 'response')).rejects.toThrow(
      'Storage operation failed'
    );
  });
});