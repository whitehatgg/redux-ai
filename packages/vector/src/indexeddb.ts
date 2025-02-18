import { VectorEntry } from './storage';

const DB_NAME = 'reduxai_vector';
const STORE_NAME = 'vector_entries';
const DB_VERSION = 1;

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('Creating vector entries store');
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: ['content', 'timestamp'] 
          });
          // Add compound index for uniqueness
          store.createIndex('content_timestamp', ['content', 'timestamp'], { unique: true });
        }
      };
    });
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Check if entry already exists
      const index = store.index('content_timestamp');
      const getRequest = index.get([entry.content, entry.timestamp]);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          console.log('Entry already exists, skipping:', entry);
          resolve(); // Skip adding duplicate
          return;
        }

        // Add new entry if it doesn't exist
        const addRequest = store.add(entry);

        addRequest.onerror = () => {
          console.error('Error adding entry:', addRequest.error);
          reject(addRequest.error);
        };

        addRequest.onsuccess = () => {
          console.log('Successfully added entry to IndexedDB');
          resolve();
        };
      };

      getRequest.onerror = () => {
        console.error('Error checking existing entry:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Error getting entries:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const entries = request.result;
        console.log(`Retrieved ${entries.length} entries from IndexedDB`);
        resolve(entries);
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        console.error('Error clearing store:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('Successfully cleared IndexedDB store');
        resolve();
      };
    });
  }
}