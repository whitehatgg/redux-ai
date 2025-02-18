import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query?: string;
  response?: string;
  state?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  timestamp: string;
}

export interface VectorConfig {
  collectionName: string;
  maxEntries: number;
  dimensions: number;
  onStateChange?: (action: { type: string; payload?: any; query?: string }) => void;
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
  private onStateChange?: VectorConfig['onStateChange'];

  private constructor(storage: IndexedDBStorage, config: VectorConfig) {
    this.storage = storage;
    this.dimensions = config.dimensions;
    this.onStateChange = config.onStateChange;
  }

  static async create(config: VectorConfig): Promise<VectorStorage> {
    try {
      console.log('Initializing vector storage...');
      const storage = new IndexedDBStorage();
      await storage.initialize();
      console.log('Vector storage initialized successfully');
      return new VectorStorage(storage, config);
    } catch (error) {
      console.error('Failed to initialize vector storage:', error);
      throw new Error(`Vector storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private notifyStateChange(action: { type: string; payload?: any; query?: string }) {
    if (this.onStateChange) {
      this.onStateChange(action);
    }
  }

  // Implement ReduxAIVector interface methods
  async addEntry(entry: VectorEntry): Promise<void> {
    try {
      console.log('Adding entry:', entry);

      // Ensure required fields are present
      const enhancedEntry: VectorEntry = {
        ...entry,
        content: entry.content,
        embedding: entry.embedding || textToVector(entry.content, this.dimensions),
        timestamp: entry.timestamp || new Date().toISOString()
      };

      await this.storage.addEntry(enhancedEntry);
      this.notifyStateChange({
        type: 'add',
        payload: { entry: enhancedEntry },
        query: entry.query
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }

  async search(params: VectorSearchParams): Promise<VectorEntry[]> {
    return this.retrieveSimilar(params.query, params.limit);
  }

  // Original methods
  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    try {
      console.log('Storing interaction:', { query, response });
      const stateString = typeof state === 'string' ? state : JSON.stringify(state);
      const entry: VectorEntry = {
        query,
        response,
        state: stateString,
        content: `${query} ${response}`,
        embedding: textToVector(`${query} ${response}`, this.dimensions),
        timestamp: new Date().toISOString(),
        metadata: { type: 'interaction' }
      };

      await this.storage.addEntry(entry);
      console.log('Entry stored successfully');

      this.notifyStateChange({
        type: 'store',
        payload: { query, response },
        query
      });
    } catch (error) {
      console.error('Error storing interaction:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      console.log('Retrieving similar interactions for query:', query);
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

      this.notifyStateChange({
        type: 'retrieve',
        payload: { query, results: scoredEntries.length },
        query
      });

      console.log(`Found ${scoredEntries.length} similar entries`);
      return scoredEntries;
    } catch (error) {
      console.error('Error retrieving similar interactions:', error);
      return [];
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      const entries = await this.storage.getAllEntries();
      this.notifyStateChange({
        type: 'list',
        payload: { count: entries.length }
      });
      return entries;
    } catch (error) {
      console.error('Error getting all entries:', error);
      return [];
    }
  }
}

export const createReduxAIVector = async (config: VectorConfig): Promise<VectorStorage> => {
  return VectorStorage.create(config);
};