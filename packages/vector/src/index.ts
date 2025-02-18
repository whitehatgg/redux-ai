import type { VectorEntry, VectorConfig, ReduxAIVector, ReduxAIAction } from './types';
import { VectorStorage } from './storage';
import { IndexedDBStorage } from './indexeddb';

export type { 
  VectorEntry,
  VectorConfig,
  ReduxAIVector,
  ReduxAIAction
};

export { VectorStorage };
export { IndexedDBStorage };

export interface VectorSearchParams {
  query: string;
  limit?: number;
}

export const createReduxAIVector = async (
  config: Partial<VectorConfig> = {}
): Promise<VectorStorage> => {
  const defaultConfig: VectorConfig = {
    collectionName: 'reduxai_vector',
    maxEntries: 100,
    dimensions: 128,
    ...config
  };
  return VectorStorage.create(defaultConfig);
};