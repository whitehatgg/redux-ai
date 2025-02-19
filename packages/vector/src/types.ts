export interface ReduxAIAction {
  type: string;
  payload?: unknown;
}

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
  addEntry: (data: VectorEntry) => Promise<void>;
  retrieveSimilar: (searchQuery: string, resultLimit?: number) => Promise<VectorEntry[]>;
  getAllEntries: () => Promise<VectorEntry[]>;
  storeInteraction: (
    userQuery: string,
    systemResponse: string,
    currentState: unknown
  ) => Promise<void>;
  subscribe: (callback: (newEntry: VectorEntry) => void) => () => void;
}
