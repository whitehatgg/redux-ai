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
}

// Event bus for vector operations
type VectorEventListener = (entry: VectorEntry) => void;

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
  private listeners: Set<VectorEventListener> = new Set();
  private operationInProgress = false;
  private operationId: string | null = null;

  private constructor(storage: IndexedDBStorage, config: VectorConfig) {
    this.storage = storage;
    this.dimensions = config.dimensions;
    console.log('VectorStorage: Initialized with dimensions:', this.dimensions);
  }

  static async create(config: VectorConfig): Promise<VectorStorage> {
    try {
      console.log('VectorStorage: Creating new instance...');
      const storage = new IndexedDBStorage();
      await storage.initialize();
      console.log('VectorStorage: IndexedDB storage initialized');
      return new VectorStorage(storage, config);
    } catch (error) {
      console.error('VectorStorage: Creation failed:', error);
      throw error;
    }
  }

  subscribe(listener: VectorEventListener) {
    console.log('VectorStorage: Adding new listener');
    this.listeners.add(listener);
    return () => {
      console.log('VectorStorage: Removing listener');
      this.listeners.delete(listener);
    };
  }

  private generateOperationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private notifyListeners(entry: VectorEntry) {
    if (this.operationInProgress) {
      console.log('VectorStorage: Skipping notification during operation:', this.operationId);
      return;
    }
    console.log('VectorStorage: Notifying listeners of new entry');
    this.listeners.forEach(listener => listener(entry));
  }

  async addEntry(entry: VectorEntry): Promise<void> {
    const newOperationId = this.generateOperationId();

    if (this.operationInProgress) {
      console.log('VectorStorage: Operation in progress, skipping duplicate addEntry:', {
        currentOp: this.operationId,
        newOp: newOperationId
      });
      return;
    }

    try {
      this.operationInProgress = true;
      this.operationId = newOperationId;
      console.log('VectorStorage: Starting addEntry operation:', this.operationId);

      const enhancedEntry: VectorEntry = {
        ...entry,
        content: entry.content,
        embedding: entry.embedding || textToVector(entry.content, this.dimensions),
        timestamp: entry.timestamp || new Date().toISOString()
      };

      await this.storage.addEntry(enhancedEntry);
      console.log('VectorStorage: Entry added successfully:', this.operationId);
      this.notifyListeners(enhancedEntry);
    } catch (error) {
      console.error('VectorStorage: Error in addEntry:', error);
      throw error;
    } finally {
      console.log('VectorStorage: Completing operation:', this.operationId);
      this.operationInProgress = false;
      this.operationId = null;
    }
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    const newOperationId = this.generateOperationId();

    if (this.operationInProgress) {
      console.log('VectorStorage: Operation in progress, skipping duplicate storeInteraction:', {
        currentOp: this.operationId,
        newOp: newOperationId
      });
      return;
    }

    try {
      this.operationInProgress = true;
      this.operationId = newOperationId;
      console.log('VectorStorage: Starting storeInteraction:', this.operationId);

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
      console.log('VectorStorage: Interaction stored successfully:', this.operationId);
      this.notifyListeners(entry);
    } catch (error) {
      console.error('VectorStorage: Error in storeInteraction:', error);
      throw error;
    } finally {
      console.log('VectorStorage: Completing operation:', this.operationId);
      this.operationInProgress = false;
      this.operationId = null;
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
      return entries;
    } catch (error) {
      console.error('Error getting all entries:', error);
      return [];
    }
  }
}

export async function resetVectorStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('reduxai_vector');

    request.onerror = () => {
      console.error('Error deleting database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Successfully deleted vector database');
      resolve();
    };
  });
}

export const createReduxAIVector = async (config: VectorConfig): Promise<VectorStorage> => {
  return VectorStorage.create(config);
};