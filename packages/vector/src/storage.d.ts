import { IndexedDBStorage } from './indexeddb';
import type { VectorEntry, ReduxAIVector } from './types';

export declare class VectorStorage {
  private storage: IndexedDBStorage;
  private constructor();
  static create(): Promise<VectorStorage>;
  storeInteraction(query: string, response: string, state: unknown): Promise<void>;
  retrieveSimilar(query: string, limit?: number): Promise<VectorEntry[]>;
  getAllEntries(): Promise<VectorEntry[]>;
}
export declare const createReduxAIVector: (config?: {
  collectionName?: string;
  maxEntries?: number;
}) => Promise<ReduxAIVector>;
export { IndexedDBStorage };