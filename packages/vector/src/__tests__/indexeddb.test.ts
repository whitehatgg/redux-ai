import { describe, expect, it, vi } from 'vitest';

import { IndexedDBStorage } from '../indexeddb';
import type { VectorEntry } from '../types';

describe('IndexedDBStorage', () => {
  let storage: IndexedDBStorage;

  /**
   * Creates a mock IDBRequest that simulates IndexedDB request behavior.
   * Handles success, error, and upgrade needed scenarios with proper timing.
   */
  const createMockRequest = (result: unknown = null, error: Error | null = null) => {
    const mockDb = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn(),
      }),
      deleteObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn(),
          getAll: vi.fn(),
          createIndex: vi.fn(),
        }),
      }),
    };

    const request = { result: error ? undefined : result || mockDb };

    // Define event handlers using Object.defineProperty to avoid duplicate key warnings
    Object.defineProperties(request, {
      error: {
        value: error,
        writable: true,
      },
      onsuccess: {
        set(handler: (event: any) => void) {
          setTimeout(() => {
            if (!error && handler) {
              handler({ target: { result: result || mockDb } });
            }
          }, 0);
        },
      },
      onerror: {
        set(handler: (event: any) => void) {
          setTimeout(() => {
            if (error && handler) {
              handler({ target: { error } });
            }
          }, 0);
        },
      },
      onupgradeneeded: {
        set(handler: (event: any) => void) {
          setTimeout(() => {
            if (!error && handler) {
              handler({ target: { result: mockDb } });
            }
          }, 0);
        },
      },
    });

    return request;
  };

  /**
   * Helper to set up a complete mock IndexedDB environment with configurable behaviors.
   * Allows simulating different error scenarios and return values for database operations.
   */
  const setupMockIndexedDB = (
    mockData: {
      openError?: Error;
      deleteError?: Error;
      addError?: Error;
      getAllResult?: VectorEntry[];
      getAllError?: Error;
    } = {}
  ) => {
    const mockStore = {
      add: vi
        .fn()
        .mockReturnValue(
          mockData.addError
            ? createMockRequest(null, mockData.addError)
            : createMockRequest(undefined)
        ),
      getAll: vi
        .fn()
        .mockReturnValue(
          mockData.getAllError
            ? createMockRequest(null, mockData.getAllError)
            : createMockRequest(mockData.getAllResult)
        ),
      createIndex: vi.fn(),
    };

    const mockDb = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
      createObjectStore: vi.fn().mockReturnValue(mockStore),
      deleteObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue(mockStore),
      }),
    };

    const mockIndexedDB = {
      open: vi
        .fn()
        .mockReturnValue(
          mockData.openError
            ? createMockRequest(null, mockData.openError)
            : createMockRequest(mockDb)
        ),
      deleteDatabase: vi
        .fn()
        .mockReturnValue(
          mockData.deleteError ? createMockRequest(null, mockData.deleteError) : createMockRequest()
        ),
    };

    return { mockIndexedDB, mockStore, mockDb };
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const { mockIndexedDB } = setupMockIndexedDB();
    vi.stubGlobal('window', { indexedDB: mockIndexedDB });

    storage = new IndexedDBStorage();
    await storage.initialize();
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      const newStorage = new IndexedDBStorage();
      await expect(newStorage.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      const { mockIndexedDB } = setupMockIndexedDB({
        openError: new Error('Failed to open database'),
      });

      vi.stubGlobal('window', { indexedDB: mockIndexedDB });
      const testStorage = new IndexedDBStorage();

      await expect(testStorage.initialize()).rejects.toThrow('Failed to open database');
    });

    it('should handle database deletion errors gracefully', async () => {
      const { mockIndexedDB } = setupMockIndexedDB({
        deleteError: new Error('Delete failed'),
      });

      vi.stubGlobal('window', { indexedDB: mockIndexedDB });
      const testStorage = new IndexedDBStorage();

      await expect(testStorage.initialize()).resolves.not.toThrow();
    });
  });

  describe('addEntry', () => {
    it('should add entry successfully', async () => {
      const testEntry: VectorEntry = {
        id: 'test-id',
        vector: [0.5, 0.5],
        metadata: { test: 'data' },
        timestamp: Date.now(),
      };

      await expect(storage.addEntry(testEntry)).resolves.not.toThrow();
    });

    it('should handle add entry errors', async () => {
      const { mockIndexedDB } = setupMockIndexedDB({
        addError: new Error('Add failed'),
      });

      vi.stubGlobal('window', { indexedDB: mockIndexedDB });
      const testStorage = new IndexedDBStorage();
      await testStorage.initialize();

      const testEntry: VectorEntry = {
        id: 'test-id',
        vector: [0.5, 0.5],
        metadata: { test: 'data' },
        timestamp: Date.now(),
      };

      await expect(testStorage.addEntry(testEntry)).rejects.toThrow('Add failed');
    });
  });

  describe('getAllEntries', () => {
    it('should retrieve all entries', async () => {
      const mockEntries: VectorEntry[] = [
        {
          id: 'test-1',
          vector: [0.5, 0.5],
          metadata: { test: 1 },
          timestamp: Date.now(),
        },
        {
          id: 'test-2',
          vector: [0.7, 0.3],
          metadata: { test: 2 },
          timestamp: Date.now(),
        },
      ];

      const { mockIndexedDB } = setupMockIndexedDB({
        getAllResult: mockEntries,
      });

      vi.stubGlobal('window', { indexedDB: mockIndexedDB });
      const testStorage = new IndexedDBStorage();
      await testStorage.initialize();

      const entries = await testStorage.getAllEntries();
      expect(entries).toEqual(mockEntries);
    });

    it('should handle retrieval errors', async () => {
      const { mockIndexedDB } = setupMockIndexedDB({
        getAllError: new Error('Failed to get entries'),
      });

      vi.stubGlobal('window', { indexedDB: mockIndexedDB });
      const testStorage = new IndexedDBStorage();
      await testStorage.initialize();

      await expect(testStorage.getAllEntries()).rejects.toThrow('Failed to get entries');
    });
  });
});
