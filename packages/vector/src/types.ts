export interface ReduxAIAction {
  type: string;
  payload?: unknown;
}

// Core vector entry type for storing vector data
export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
  timestamp: number;
}

// Configuration options for vector storage
export interface VectorConfig {
  dimensions: number;
  collectionName?: string;
  maxEntries?: number;
}

// Public interface for vector operations
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
