import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private indexedDB: IndexedDBStorage;

  private constructor(indexedDB: IndexedDBStorage) {
    this.indexedDB = indexedDB;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    const indexedDB = new IndexedDBStorage();
    await indexedDB.initialize();
    return new VectorStorage(indexedDB);
  }

  async addEntry(entry: VectorEntry) {
    try {
      console.log('Adding new entry to vector storage');
      await this.indexedDB.addEntry(entry);
      console.log('Successfully added entry');
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      const entries = await this.indexedDB.getAllEntries();
      if (entries.length === 0) return [];

      // Sort by timestamp descending (most recent first) and return top N
      return entries
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to find similar entries:', error);
      return [];
    }
  }
}