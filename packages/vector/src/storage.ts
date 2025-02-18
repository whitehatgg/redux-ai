import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
  embedding?: number[]; // Add embedding field
}

export interface VectorConfig {
  collectionName?: string;
  maxEntries?: number;
  dimensions?: number; // Add dimensions config
}

// Simple text to vector function for demo purposes
function textToVector(text: string, dimensions: number = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  for (let i = 0; i < normalized.length && i < dimensions; i++) {
    vector[i] = normalized.charCodeAt(i) / 255; // Normalize to [0,1]
  }

  return vector;
}

// Cosine similarity between two vectors
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

export class ReduxAIVector {
  private storage: VectorStorage;
  private maxEntries: number;
  private dimensions: number;

  private constructor(storage: VectorStorage, config: VectorConfig = {}) {
    this.storage = storage;
    this.maxEntries = config.maxEntries || 100;
    this.dimensions = config.dimensions || 128;
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
    const embedding = textToVector(query, this.dimensions);
    return this.storage.storeInteraction(query, response, state, embedding);
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      console.log('Retrieving similar interactions for query:', query);
      const queryEmbedding = textToVector(query, this.dimensions);
      const entries = await this.getAllEntries();

      // Sort by cosine similarity
      const scoredEntries = entries.map(entry => ({
        entry,
        score: cosineSimilarity(queryEmbedding, entry.embedding || [])
      }));

      const sortedEntries = scoredEntries
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(limit, this.maxEntries))
        .map(({entry}) => entry);

      console.log(`Retrieved ${sortedEntries.length} similar interactions`);
      return sortedEntries;
    } catch (error) {
      console.error('Error retrieving similar interactions:', error);
      return [];
    }
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

  async storeInteraction(query: string, response: string, state: any, embedding: number[]): Promise<void> {
    try {
      console.log('Storing interaction:', { query, response });
      const stateString = typeof state === 'string' ? state : JSON.stringify(state, null, 2);

      const entry: VectorEntry = {
        query,
        response,
        state: stateString,
        timestamp: new Date().toISOString(),
        embedding,
      };

      await this.storage.addEntry(entry);
      console.log('Interaction stored successfully');
    } catch (error) {
      console.error('Error storing interaction:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    return this.getAllEntries();
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