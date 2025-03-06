import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VectorStorage } from '../storage';
import type { VectorEntry, InteractionMetadata } from '../types';

// Mock IndexedDB storage
vi.mock('../indexeddb', () => ({
  IndexedDBStorage: class MockIndexedDB {
    async initialize() {}
    async addEntry(entry: VectorEntry) {}
    async getAllEntries() {
      return [];
    }
  },
}));

describe('VectorStorage', () => {
  let storage: VectorStorage;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const testConfig = { dimensions: 128 };

  beforeEach(async () => {
    storage = await VectorStorage.create(testConfig);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('addEntry', () => {
    it('should add vector entry', async () => {
      const testEntry = {
        vector: Array(128).fill(0.5),
        metadata: { test: 'data' },
      };

      await expect(storage.addEntry(testEntry)).resolves.not.toThrow();
    });

    it('should notify listeners on new entry', async () => {
      const listener = vi.fn();
      storage.subscribe(listener);

      const testEntry = {
        vector: Array(128).fill(0.5),
        metadata: { test: 'data' },
      };

      await storage.addEntry(testEntry);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('storeInteraction', () => {
    it('should store interaction data with intent and action', async () => {
      const query = 'test query';
      const response = 'test response';
      const metadata: InteractionMetadata = {
        intent: 'action',
        action: { type: 'test/increment' }
      };

      await expect(storage.storeInteraction(query, response, metadata)).resolves.not.toThrow();
    });

    it('should store interaction data without optional metadata', async () => {
      const query = 'test query';
      const response = 'test response';

      await expect(storage.storeInteraction(query, response)).resolves.not.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      const mockStorage = vi.spyOn(storage as any, 'storage', 'get').mockReturnValue({
        addEntry: vi.fn().mockRejectedValue(new Error('Storage error'))
      });

      await expect(storage.storeInteraction('query', 'response')).rejects.toThrow('Failed to store interaction');
      mockStorage.mockRestore();
    });
  });

  describe('retrieveSimilar', () => {
    it('should return similar entries', async () => {
      const entries = await storage.retrieveSimilar('test query', 5);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty query', async () => {
      const entries = await storage.retrieveSimilar('');
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe('subscription system', () => {
    it('should manage multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = storage.subscribe(listener1);
      const unsubscribe2 = storage.subscribe(listener2);

      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
    });

    it('should remove listeners on unsubscribe', async () => {
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);

      unsubscribe();

      const testEntry = {
        vector: Array(128).fill(0.5),
        metadata: { test: 'data' },
      };

      await storage.addEntry(testEntry);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      storage.subscribe(errorListener);

      const testEntry = {
        vector: Array(128).fill(0.5),
        metadata: { test: 'data' },
      };

      await expect(storage.addEntry(testEntry)).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error in vector storage listener:', expect.any(Error));
    });
  });
});