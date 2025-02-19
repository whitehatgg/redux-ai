import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}
export interface VectorConfig {
  collectionName?: string;
  maxEntries?: number;
}
export declare class ReduxAIVector {
  private storage;
  private maxEntries;
  private constructor();
  static create(config: VectorConfig): Promise<ReduxAIVector>;
  storeInteraction(query: string, response: string, state: any): Promise<void>;
  retrieveSimilar(query: string, limit?: number): Promise<VectorEntry[]>;
  getAllEntries(): Promise<VectorEntry[]>;
}
export declare const createReduxAIVector: (config?: VectorConfig) => Promise<ReduxAIVector>;
export { IndexedDBStorage };
