import { VectorStorage } from './storage';

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

export interface VectorSearchParams {
  query: string;
  limit?: number;
}

export interface ReduxAIVector {
  addEntry(entry: VectorEntry): Promise<void>;
  storeInteraction(query: string, response: string, state: any): Promise<void>;
  retrieveSimilar(query: string, limit?: number): Promise<VectorEntry[]>;
  getAllEntries(): Promise<VectorEntry[]>;
  subscribe(listener: (entry: VectorEntry) => void): () => void;
}

export { VectorStorage, createReduxAIVector } from './storage';
export { IndexedDBStorage } from './indexeddb';