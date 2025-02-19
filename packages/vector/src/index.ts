import { IndexedDBStorage } from './indexeddb';
import { VectorStorage } from './storage';
import type { ReduxAIAction, ReduxAIVector, VectorConfig, VectorEntry } from './types';

export type { VectorEntry, VectorConfig, ReduxAIVector, ReduxAIAction };

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
    ...config,
  };
  return VectorStorage.create(defaultConfig);
};
