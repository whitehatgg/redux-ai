import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VectorStorage } from '../storage';
import type { VectorEntry } from '../types';

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
    vi.clearAllMocks();
  });

  describe('core functionality', () => {
    it('should create storage instance', () => {
      expect(storage).toBeInstanceOf(VectorStorage);
    });

    it('should add vector entry', async () => {
      const testEntry = {
        vector: Array(128).fill(0.5),
        metadata: { test: 'data' },
      };

      await expect(storage.addEntry(testEntry)).resolves.not.toThrow();
    });
  });

  describe('subscription system', () => {
    it('should manage subscription', () => {
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove listeners on unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);
      unsubscribe();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});