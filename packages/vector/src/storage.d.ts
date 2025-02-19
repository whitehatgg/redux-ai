import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}
export declare class VectorStorage {
  private storage;
  private constructor();
  static create(): Promise<VectorStorage>;
  storeInteraction(query: string, response: string, state: any): Promise<void>;
  retrieveSimilar(query: string, limit?: number): Promise<VectorEntry[]>;
  getAllEntries(): Promise<VectorEntry[]>;
}
export declare const createReduxAIVector: (config?: {
  collectionName?: string;
  maxEntries?: number;
}) => Promise<any>;
export { IndexedDBStorage };
