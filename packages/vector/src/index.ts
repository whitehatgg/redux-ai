import type { InteractionMetadata, ReduxAIVector, VectorConfig, VectorEntry } from './types';
import { VectorStorage } from './storage';

// Export implementations
export { VectorStorage };

// Export types
export type { 
  ReduxAIVector,
  VectorConfig,
  VectorEntry,
  InteractionMetadata
};

// Create a vector storage instance
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