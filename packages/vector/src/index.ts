import { IndexedDBStorage } from './indexeddb';
import { VectorStorage } from './storage';

// Core vector entry type for storing vector data
export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
  timestamp: number;
}

// Configuration options for vector storage
export interface VectorConfig {
  dimensions: number;
  collectionName?: string;
  maxEntries?: number;
}

export interface ReduxAIAction {
  type: string;
  payload?: unknown;
}

// Public interface for vector operations
export interface ReduxAIVector {
  addEntry: (data: VectorEntry) => Promise<void>;
  retrieveSimilar: (searchQuery: string, resultLimit?: number) => Promise<VectorEntry[]>;
  getAllEntries: () => Promise<VectorEntry[]>;
  storeInteraction: (
    userQuery: string,
    systemResponse: string,
    currentState: unknown
  ) => Promise<void>;
  subscribe: (callback: (newEntry: VectorEntry) => void) => () => void;
}

export interface VectorSearchParams {
  query: string;
  limit?: number;
}

// Export implementations
export { VectorStorage };
export { IndexedDBStorage };

// Create a vector storage instance
export const createReduxAIVector = async (
  config: Partial<VectorConfig> = {}
): Promise<VectorStorage> => {
  const defaultConfig: VectorConfig = {
    dimensions: 128,
    collectionName: 'reduxai_vector',
    maxEntries: 100,
    ...config,
  };

  const storage = await VectorStorage.create(defaultConfig);
  return storage;
};
