import type { VectorEntry } from './types';

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'vector-store';
  private readonly storeName = 'vectors';
  private initialized = false;

  constructor() {
    this.db = null;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.debug('[IndexedDB] Starting initialization');
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      this.db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      this.initialized = true;
      console.debug('[IndexedDB] Initialization complete');
    } catch (error) {
      console.error('[IndexedDB] Initialization failed:', error);
      throw new Error('Failed to initialize IndexedDB');
    }
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    try {
      const store = this.getStore('readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[IndexedDB] Failed to add entry:', error);
      throw error;
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      const store = this.getStore('readonly');
      return new Promise<VectorEntry[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[IndexedDB] Failed to get entries:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      this.initialized = false;

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(this.dbName);
        request.onsuccess = () => {
          console.debug('[IndexedDB] Cleanup complete');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[IndexedDB] Cleanup failed:', error);
      throw error;
    }
  }
}