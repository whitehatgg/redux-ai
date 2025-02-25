import { IndexedDBStorage } from './indexeddb';
import type { ReduxAIVector, VectorConfig, VectorEntry } from './types';

export function textToVector(text: string, dimensions = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  for (let i = 0; i < normalized.length && i < dimensions; i++) {
    vector[i] = normalized.charCodeAt(i) / 255;
  }

  return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
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

export class VectorStorage implements ReduxAIVector {
  private storage: IndexedDBStorage;
  private dimensions: number;
  private readonly listeners = new Set<(entry: VectorEntry) => void>();

  protected constructor(config: VectorConfig) {
    this.storage = new IndexedDBStorage();
    this.dimensions = config.dimensions;
  }

  private async initialize(): Promise<void> {
    try {
      await this.storage.initialize();
    } catch (error) {
      throw new Error('Vector storage initialization failed');
    }
  }

  static async create(config: VectorConfig): Promise<VectorStorage> {
    const storage = new VectorStorage(config);
    await storage.initialize();
    return storage;
  }

  async addEntry(input: { vector: number[]; metadata: Record<string, unknown> }): Promise<void> {
    try {
      const entry: VectorEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        vector: input.vector,
        metadata: input.metadata,
        timestamp: Date.now(),
      };

      await this.storage.addEntry(entry);
      this.notifyListeners(entry);
    } catch (error) {
      throw new Error('Failed to add vector entry');
    }
  }

  async storeInteraction(query: string, response: string, state: unknown): Promise<void> {
    try {
      const stateString = JSON.stringify(state);

      await this.addEntry({
        vector: textToVector(`${query} ${response}`, this.dimensions),
        metadata: {
          query,
          response,
          state: stateString
        },
      });
    } catch (error) {
      throw new Error('Failed to store interaction');
    }
  }

  async retrieveSimilar(query: string, limit = 5): Promise<VectorEntry[]> {
    try {
      const queryVector = textToVector(query, this.dimensions);
      const entries = await this.storage.getAllEntries();

      return entries
        .map(entry => ({
          entry,
          score: cosineSimilarity(queryVector, entry.vector),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ entry }) => entry);
    } catch (error) {
      return [];
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      return await this.storage.getAllEntries();
    } catch (error) {
      return [];
    }
  }

  subscribe(listener: (entry: VectorEntry) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(entry: VectorEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in vector storage listener:', error);
      }
    });
  }
}