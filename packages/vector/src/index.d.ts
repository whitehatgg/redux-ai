import { IndexedDBStorage } from './indexeddb';
import type { ReduxAIVector, VectorConfig, VectorEntry } from './types';

export declare const createReduxAIVector: (config?: VectorConfig) => Promise<ReduxAIVector>;
export { IndexedDBStorage, VectorEntry, VectorConfig, ReduxAIVector };
