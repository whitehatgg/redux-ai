import { VectorStorage, VectorEntry } from './storage';

// Re-export the VectorEntry type from storage to maintain consistency
export type { VectorEntry } from './storage';

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