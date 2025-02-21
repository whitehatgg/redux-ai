import { IndexedDBStorage } from './indexeddb';
import type { ReduxAIVector, VectorConfig, VectorEntry } from './types';

export declare class VectorStorage implements ReduxAIVector {
  private storage: IndexedDBStorage;
  private dimensions: number;
  private readonly listeners: Set<(entry: VectorEntry) => void>;

  private constructor(storage: IndexedDBStorage, config: VectorConfig);
  static create(config: VectorConfig): Promise<ReduxAIVector>;

  addEntry(input: { vector: number[]; metadata: Record<string, unknown> }): Promise<void>;
  storeInteraction(query: string, response: string, state: unknown): Promise<void>;
  retrieveSimilar(query: string, limit?: number): Promise<VectorEntry[]>;
  getAllEntries(): Promise<VectorEntry[]>;
  subscribe(listener: (entry: VectorEntry) => void): () => void;
  private notifyListeners(entry: VectorEntry): void;
}

export declare const createReduxAIVector: (config?: {
  collectionName?: string;
  maxEntries?: number;
}) => Promise<ReduxAIVector>;

export { IndexedDBStorage };
