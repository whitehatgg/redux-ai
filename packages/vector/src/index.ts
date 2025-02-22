import { IndexedDBStorage } from './indexeddb';
import { VectorStorage } from './storage';
import type { ReduxAIAction, ReduxAIVector, VectorConfig, VectorEntry } from './types';

// Re-export all types explicitly
export type { ReduxAIAction, ReduxAIVector, VectorConfig, VectorEntry };

// Export implementations
export { VectorStorage };
export { IndexedDBStorage };

export interface VectorSearchParams {
  query: string;
  limit?: number;
}

// Create a vector storage instance with proper types
export const createReduxAIVector = async (
  config: Partial<VectorConfig> = {}
): Promise<ReduxAIVector> => {
  const defaultConfig: VectorConfig = {
    dimensions: 128,
    collectionName: 'reduxai_vector',
    maxEntries: 100,
    ...config,
  };

  const storage = await VectorStorage.create(defaultConfig);
  return storage;
};
