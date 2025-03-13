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

    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'id' });
      }
    };

    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to initialize IndexedDB'));
    });

    this.initialized = true;
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db || !this.initialized) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    const store = this.getStore('readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    const store = this.getStore('readonly');
    return new Promise<VectorEntry[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}