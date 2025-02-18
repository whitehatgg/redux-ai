import type { VectorEntry } from './types';

const DB_NAME = 'reduxai_vector';
const STORE_NAME = 'vector_entries';
const DB_VERSION = 1;

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[IndexedDB] IndexedDB not available');
      return;
    }

    try {
      await new Promise<void>((resolve, _reject) => {
        const deleteRequest = window.indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
          console.log('[IndexedDB] Successfully deleted old database');
          resolve();
        };
        deleteRequest.onerror = (_e) => {
          console.warn('[IndexedDB] Error deleting old database');
          resolve(); // Continue even if delete fails
        };
      });
    } catch (error) {
      console.warn('[IndexedDB] Error during database deletion:', error);
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (_event) => {
        const error = request.error;
        console.error('[IndexedDB] Database error:', {
          name: error?.name,
          message: error?.message,
          code: error?.code,
        });
        reject(new Error(`Failed to open IndexedDB: ${error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Successfully opened database');
        resolve();
      };

      request.onupgradeneeded = (_event) => {
        const db = request.result;

        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }

        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });

        console.log('[IndexedDB] Store created successfully');
      };
    });
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[IndexedDB] Adding entry:', { id: entry.id, timestamp: entry.timestamp });

        const transaction = this.db?.transaction([STORE_NAME], 'readwrite');
        if (!transaction) {
          throw new Error('Failed to create transaction');
        }

        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({
          ...entry,
          id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`
        });

        request.onsuccess = () => {
          console.log('[IndexedDB] Entry added successfully');
          resolve();
        };

        request.onerror = () => {
          const error = request.error;
          console.error('[IndexedDB] Error adding entry:', {
            name: error?.name,
            message: error?.message,
            code: error?.code,
          });
          reject(new Error(`Failed to add entry: ${error?.message}`));
        };
      } catch (error) {
        console.error('[IndexedDB] Critical error in addEntry:', error);
        reject(error);
      }
    });
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db?.transaction([STORE_NAME], 'readonly');
        if (!transaction) {
          throw new Error('Failed to create transaction');
        }

        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          const error = request.error;
          console.error('[IndexedDB] Error getting entries:', {
            name: error?.name,
            message: error?.message,
            code: error?.code,
          });
          reject(new Error(`Failed to get entries: ${error?.message}`));
        };
      } catch (error) {
        console.error('[IndexedDB] Critical error in getAllEntries:', error);
        reject(error);
      }
    });
  }
}