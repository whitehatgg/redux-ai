import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export interface VectorConfig {
  collectionName?: string;
  maxEntries?: number;
}

export class ReduxAIVector {
  private storage: VectorStorage;
  private maxEntries: number;

  private constructor(storage: VectorStorage, config: VectorConfig = {}) {
    this.storage = storage;
    this.maxEntries = config.maxEntries || 100;
  }

  static async create(config: VectorConfig = {}): Promise<ReduxAIVector> {
    try {
      console.log('Initializing vector storage...');
      const storage = await VectorStorage.create();
      console.log('Vector storage initialized successfully');
      return new ReduxAIVector(storage, config);
    } catch (error) {
      console.error('Failed to initialize vector storage:', error);
      throw new Error(`Vector storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    return this.storage.storeInteraction(query, response, state);
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    return this.storage.retrieveSimilar(query, Math.min(limit, this.maxEntries));
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    return this.storage.getAllEntries();
  }
}

export class VectorStorage {
  private storage: IndexedDBStorage;

  private constructor(storage: IndexedDBStorage) {
    this.storage = storage;
  }

  static async create(): Promise<VectorStorage> {
    try {
      console.log('Initializing vector storage...');
      const storage = new IndexedDBStorage();
      await storage.initialize();
      console.log('Vector storage initialized successfully');
      return new VectorStorage(storage);
    } catch (error) {
      console.error('Failed to initialize vector storage:', error);
      throw new Error(`Vector storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    try {
      console.log('Storing interaction:', { query, response });
      const stateString = typeof state === 'string' ? state : JSON.stringify(state, null, 2);

      const entry: VectorEntry = {
        query,
        response,
        state: stateString,
        timestamp: new Date().toISOString(),
      };

      await this.storage.addEntry(entry);
      console.log('Interaction stored successfully');
    } catch (error) {
      console.error('Error storing interaction:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      console.log('Retrieving similar interactions for query:', query);
      const entries = await this.getAllEntries();
      if (entries.length === 0) {
        console.log('No entries found in storage');
        return [];
      }

      const sortedEntries = entries
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, Math.min(limit, entries.length));

      console.log(`Retrieved ${sortedEntries.length} similar interactions`);
      return sortedEntries;
    } catch (error) {
      console.error('Error retrieving similar interactions:', error);
      return [];
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      console.log('Getting all entries from storage');
      const entries = await this.storage.getAllEntries();
      if (!Array.isArray(entries)) {
        console.warn('Storage returned non-array entries, converting to array');
        return [];
      }
      console.log(`Retrieved ${entries.length} entries from storage`);
      return entries;
    } catch (error) {
      console.error('Failed to get all entries:', error);
      return [];
    }
  }
}

export const createReduxAIVector = async (config: VectorConfig = {}): Promise<ReduxAIVector> => {
  return ReduxAIVector.create(config);
};