import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  content: string;
  query?: string;
  response?: string;
  state?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  timestamp: string;
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
    console.log('[VectorStorage] Adding entry:', {
      content: entry.content?.substring(0, 50),
      metadata: entry.metadata
    });

    const enhancedEntry: VectorEntry = {
      ...entry,
      content: entry.content,
      embedding: entry.embedding || textToVector(entry.content, this.dimensions),
      timestamp: entry.timestamp || new Date().toISOString()
    };

    await this.storage.addEntry(enhancedEntry);
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    console.log('[VectorStorage] Storing interaction:', {
      query: query?.substring(0, 50),
      response: response?.substring(0, 50)
    });

    const stateString = typeof state === 'string' ? state : JSON.stringify(state);
    const timestamp = new Date().toISOString();

    const entry: VectorEntry = {
      query,
      response,
      state: stateString,
      content: `${query} ${response}`,
      embedding: textToVector(`${query} ${response}`, this.dimensions),
      timestamp,
      metadata: { type: 'interaction' }
    };

    await this.storage.addEntry(entry);
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    console.log('[VectorStorage] Retrieving similar entries for query:', query);

    try {
      const queryEmbedding = textToVector(query, this.dimensions);
      const entries = await this.storage.getAllEntries();

      const scoredEntries = entries
        .map(entry => ({
          entry,
          score: cosineSimilarity(queryEmbedding, entry.embedding || [])
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ entry }) => entry);

      return scoredEntries;
    } catch (error) {
      console.error('[VectorStorage] Error retrieving similar:', error);
      return [];
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      const entries = await this.storage.getAllEntries();
      return entries;
    } catch (error) {
      console.error('[VectorStorage] Error getting all entries:', error);
      return [];
    }
  }

  subscribe(listener: (entry: VectorEntry) => void) {
    console.log('[VectorStorage] Adding new listener');
    return () => {
      console.log('[VectorStorage] Removing listener');
    };
  }
}

export const createReduxAIVector = async (config: VectorConfig): Promise<VectorStorage> => {
  return VectorStorage.create(config);
};