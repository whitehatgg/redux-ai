import { IndexedDBStorage } from './indexeddb';
import type { VectorEntry, VectorConfig, ReduxAIVector } from './types';

export declare const createReduxAIVector: (config?: VectorConfig) => Promise<ReduxAIVector>;
export { IndexedDBStorage, VectorEntry, VectorConfig, ReduxAIVector };