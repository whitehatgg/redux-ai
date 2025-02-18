import { VectorStorage } from './storage';

export interface VectorEntry {
  content: string;
  metadata?: Record<string, any>;
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
  search(params: VectorSearchParams): Promise<VectorEntry[]>;
}

export { VectorStorage, createReduxAIVector } from './storage';
export { IndexedDBStorage } from './indexeddb';