import { IndexedDBStorage } from './indexeddb';
import { VectorStorage } from './storage';
import type { ReduxAIAction, ReduxAIVector, VectorConfig, VectorEntry } from './types';

// Export all types that other packages need
export type { ReduxAIVector, VectorEntry, VectorConfig, ReduxAIAction };

// Export implementations
export { VectorStorage };
export { IndexedDBStorage };

export interface VectorSearchParams {
  query: string;
  limit?: number;
}

export const createReduxAIVector = async (
  config: Partial<VectorConfig> = {}
): Promise<ReduxAIVector> => {
  const defaultConfig: VectorConfig = {
    collectionName: 'reduxai_vector',
    maxEntries: 100,
    dimensions: 128,
    ...config,
  };
  const storage = await VectorStorage.create(defaultConfig);
  return storage;
};
