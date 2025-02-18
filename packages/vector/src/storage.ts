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

type VectorEventListener = (entry: VectorEntry) => void;

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
  private listeners: Set<VectorEventListener> = new Set();
  private static instanceCount = 0;
  private instanceId: number;

  private constructor(storage: IndexedDBStorage, config: VectorConfig) {
    VectorStorage.instanceCount++;
    this.instanceId = VectorStorage.instanceCount;
    this.storage = storage;
    this.dimensions = config.dimensions;
    console.log(`[VectorStorage ${this.instanceId}] Created new instance`);
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

  subscribe(listener: VectorEventListener) {
    console.log(`[VectorStorage ${this.instanceId}] Adding new listener. Current count: ${this.listeners.size}`);
    this.listeners.add(listener);
    return () => {
      console.log(`[VectorStorage ${this.instanceId}] Removing listener. Remaining count: ${this.listeners.size - 1}`);
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(entry: VectorEntry) {
    console.log(`[VectorStorage ${this.instanceId}] Notifying ${this.listeners.size} listeners of new entry:`, {
      type: entry.metadata?.type,
      content: entry.content?.substring(0, 50)
    });
    this.listeners.forEach(listener => listener(entry));
  }

  async addEntry(entry: VectorEntry, notify: boolean = true): Promise<void> {
    console.log(`[VectorStorage ${this.instanceId}] Adding entry:`, {
      content: entry.content?.substring(0, 50),
      metadata: entry.metadata,
      notify
    });

    const enhancedEntry: VectorEntry = {
      ...entry,
      content: entry.content,
      embedding: entry.embedding || textToVector(entry.content, this.dimensions),
      timestamp: entry.timestamp || new Date().toISOString()
    };

    await this.storage.addEntry(enhancedEntry);

    if (notify) {
      this.notifyListeners(enhancedEntry);
    }
  }

  async storeInteraction(query: string, response: string, state: any): Promise<void> {
    console.log(`[VectorStorage ${this.instanceId}] Storing interaction:`, {
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

    // Pass notify=false since we'll notify after storing
    await this.addEntry(entry, false);
    this.notifyListeners(entry);
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    console.log(`[VectorStorage ${this.instanceId}] Retrieving similar entries for query:`, query);
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

      console.log(`[VectorStorage ${this.instanceId}] Found ${scoredEntries.length} similar entries`);
      return scoredEntries;
    } catch (error) {
      console.error(`[VectorStorage ${this.instanceId}] Error retrieving similar:`, error);
      return [];
    }
  }

  async getAllEntries(): Promise<VectorEntry[]> {
    try {
      const entries = await this.storage.getAllEntries();
      console.log(`[VectorStorage ${this.instanceId}] Retrieved ${entries.length} entries`);
      return entries;
    } catch (error) {
      console.error(`[VectorStorage ${this.instanceId}] Error getting all entries:`, error);
      return [];
    }
  }
}

export const createReduxAIVector = async (config: VectorConfig): Promise<VectorStorage> => {
  return VectorStorage.create(config);
};