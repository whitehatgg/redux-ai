import type { ReduxAIAction } from '@redux-ai/state';

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface VectorConfig {
  collectionName: string;
  maxEntries: number;
  dimensions: number;
}

export interface ReduxAIVector {
  addEntry: (entry: VectorEntry) => Promise<void>;
  retrieveSimilar: (query: string, limit?: number) => Promise<VectorEntry[]>;
  getAllEntries: () => Promise<VectorEntry[]>;
  storeInteraction: (query: string, response: string, state: unknown) => Promise<void>;
  subscribe: (callback: (entry: VectorEntry) => void) => () => void;
}

export type { ReduxAIAction };