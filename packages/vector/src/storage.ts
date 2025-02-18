import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query?: string;
  response?: string;
  state?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  timestamp: string;
  id?: string;
}

export interface VectorConfig {
  collectionName: string;
  maxEntries: number;
  dimensions: number;
}

function textToVector(text: string, dimensions: number = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  for (let i = 0; i < normalized.length && i < dimensions; i++) {
    vector[i] = normalized.charCodeAt(i) / 255;
  }

  return vector;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return normA && normB ? dotProduct / (normA * normB) : 0;
}

export class VectorStorage {
  private storage: IndexedDBStorage;
  private dimensions: number;
  private listeners: Set<(entry: VectorEntry) => void> = new Set();

  private constructor(storage: IndexedDBStorage, config: VectorConfig) {
    this.storage = storage;
    this.dimensions = config.dimensions;
  }

  static async create(config: VectorConfig): Promise<VectorStorage> {
    try {
      console.log('[VectorStorage] Creating new instance...');
      const storage = new IndexedDBStorage();
      await storage.initialize();
      return new VectorStorage(storage, config);
    } catch (error) {
      console.error('[VectorStorage] Creation failed:', error);
      throw error;
    }
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    try {
      console.log('[VectorStorage] Adding entry:', {
        query: entry.query?.substring(0, 50),
        response: entry.response?.substring(0,50),
        metadata: entry.metadata
      });

      const enhancedEntry: VectorEntry = {
        ...entry,
        embedding: entry.embedding || textToVector(entry.query || entry.response || "", this.dimensions),
        timestamp: entry.timestamp || new Date().toISOString()
      };

      await this.storage.addEntry(enhancedEntry);
      this.notifyListeners(enhancedEntry);
    } catch (error) {
      console.error('[VectorStorage] Error adding entry:', error);
      throw error;
    }
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    try {
      console.log('[VectorStorage] Storing interaction:', {
        query: query?.substring(0, 50),
        response: response?.substring(0, 50)
      });

      const stateString = typeof state === 'string' ? state : JSON.stringify(state);
      const timestamp = new Date().toISOString();
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const entry: VectorEntry = {
        id,
        query,
        response,
        state: stateString,
        embedding: textToVector(`${query} ${response}`, this.dimensions),
        timestamp,
        metadata: { type: 'interaction' }
      };

      await this.storage.addEntry(entry);
      this.notifyListeners(entry);
    } catch (error) {
      console.error('[VectorStorage] Error storing interaction:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      console.log('[VectorStorage] Retrieving similar entries for query:', query);
      const queryEmbedding = textToVector(query, this.dimensions);
      const entries = await this.storage.getAllEntries();

      return entries
        .map(entry => ({
          entry,
          score: cosineSimilarity(queryEmbedding, entry.embedding || [])
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ entry }) => entry);
    } catch (error) {
      console.error('[VectorStorage] Error retrieving similar:', error);
      return [];
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      return await this.storage.getAllEntries();
    } catch (error) {
      console.error('[VectorStorage] Error getting all entries:', error);
      return [];
    }
  }

  subscribe(listener: (entry: VectorEntry) => void) {
    console.log('[VectorStorage] Adding new listener');
    this.listeners.add(listener);
    return () => {
      console.log('[VectorStorage] Removing listener');
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(entry: VectorEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('[VectorStorage] Error in listener:', error);
      }
    });
  }
}

export const createReduxAIVector = async (config: VectorConfig): Promise<VectorStorage> => {
  return VectorStorage.create(config);
};