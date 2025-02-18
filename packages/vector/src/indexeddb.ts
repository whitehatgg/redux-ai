import { VectorEntry } from './storage';

const DB_NAME = 'reduxai_vector';
const STORE_NAME = 'vector_entries';
const DB_VERSION = 3; // Increment version to trigger database upgrade

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[IndexedDB] IndexedDB not available');
      return;
    }

    // Delete existing database to ensure clean slate
    await new Promise<void>((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve(); // Continue even if delete fails
    });

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.error('[IndexedDB] Database error:', request.error);
          reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('[IndexedDB] Successfully opened database');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          try {
            if (db.objectStoreNames.contains(STORE_NAME)) {
              db.deleteObjectStore(STORE_NAME);
            }
            console.log('[IndexedDB] Creating vector entries store');
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          } catch (error) {
            console.error('[IndexedDB] Error in upgrade:', error);
            reject(error);
          }
        };
      } catch (error) {
        console.error('[IndexedDB] Critical error during initialization:', error);
        reject(error);
      }
    });
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    if (!this.db) {
      console.warn('[IndexedDB] Database not initialized, attempting to initialize...');
      await this.initialize();
      if (!this.db) throw new Error('Failed to initialize database');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entryWithId = {
          ...entry,
          id: entry.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        const request = store.add(entryWithId);

        request.onerror = () => {
          console.error('[IndexedDB] Error adding entry:', request.error);
          reject(new Error('Failed to add entry to IndexedDB'));
        };

        request.onsuccess = () => {
          console.log('[IndexedDB] Successfully added entry');
          resolve();
        };

      } catch (error) {
        console.error('[IndexedDB] Error in addEntry:', error);
        reject(error);
      }
    });
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    if (!this.db) {
      console.warn('[IndexedDB] Database not initialized, attempting to initialize...');
      await this.initialize();
      if (!this.db) throw new Error('Failed to initialize database');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => {
          console.error('[IndexedDB] Error getting entries:', request.error);
          reject(new Error('Failed to get entries from IndexedDB'));
        };

        request.onsuccess = () => {
          const entries = request.result;
          console.log(`[IndexedDB] Retrieved ${entries.length} entries`);
          resolve(entries);
        };

      } catch (error) {
        console.error('[IndexedDB] Error in getAllEntries:', error);
        reject(error);
      }
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
          console.error('[IndexedDB] Error clearing store:', request.error);
          reject(new Error('Failed to clear IndexedDB store'));
        };

        request.onsuccess = () => {
          console.log('[IndexedDB] Successfully cleared store');
          resolve();
        };

      } catch (error) {
        console.error('[IndexedDB] Error in clear:', error);
        reject(error);
      }
    });
  }
}