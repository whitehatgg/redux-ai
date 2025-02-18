import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  timestamp?: string;
}

export interface VectorConfig {
  collectionName: string;
  maxEntries: number;
  dimensions: number;
}

export interface VectorSearchParams {
  query: string;
  limit?: number;
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

export class VectorStorage {
  private storage: IndexedDBStorage;
  private dimensions: number;

  private constructor(storage: IndexedDBStorage, dimensions: number = 128) {
    this.storage = storage;
    this.dimensions = dimensions;
  }

  static async create(dimensions: number = 128): Promise<VectorStorage> {
    try {
      console.log('Initializing vector storage...');
      const storage = new IndexedDBStorage();
      await storage.initialize();
      console.log('Vector storage initialized successfully');
      return new VectorStorage(storage, dimensions);
    } catch (error) {
      console.error('Failed to initialize vector storage:', error);
      throw new Error(`Vector storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    try {
      console.log('Storing entry:', entry);
      const embedding = textToVector(entry.content, this.dimensions);
      await this.storage.addEntry({
        ...entry,
        embedding,
        timestamp: new Date().toISOString()
      });
      console.log('Entry stored successfully');
    } catch (error) {
      console.error('Error storing entry:', error);
      throw error;
    }
  }

  async search(params: VectorSearchParams): Promise<VectorEntry[]> {
    try {
      console.log('Searching for similar entries:', params);
      const queryEmbedding = textToVector(params.query, this.dimensions);
      const entries = await this.storage.getAllEntries();

      // Sort by cosine similarity
      const scoredEntries = entries
        .map(entry => ({
          entry,
          score: cosineSimilarity(queryEmbedding, entry.embedding || [])
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, params.limit || 5)
        .map(({ entry }) => ({
          content: entry.content,
          metadata: entry.metadata,
          embedding: entry.embedding,
          timestamp: entry.timestamp
        }));

      console.log(`Found ${scoredEntries.length} similar entries`);
      return scoredEntries;
    } catch (error) {
      console.error('Error searching entries:', error);
      return [];
    }
  }
}

export const createReduxAIVector = async (config: VectorConfig): Promise<VectorStorage> => {
  const storage = await VectorStorage.create(config.dimensions);
  return storage;
};