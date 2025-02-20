import { IndexedDBStorage } from './indexeddb';
import { VectorStorage } from './storage';
import type { VectorConfig, VectorEntry } from './types';

export interface VectorSearchParams {
  query: string;
  limit?: number;
}

export declare const createReduxAIVector: (
  config?: Partial<VectorConfig>
) => Promise<VectorStorage>;

export { IndexedDBStorage, VectorEntry, VectorConfig, VectorStorage };
