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

// Metadata type for storeInteraction
export interface InteractionMetadata {
  intent?: string;
  action?: Record<string, unknown>;
}

// Public interface for vector operations
export interface ReduxAIVector {
  addEntry: (data: { vector: number[]; metadata: Record<string, unknown> }) => Promise<void>;
  retrieveSimilar: (searchQuery: string, resultLimit?: number) => Promise<VectorEntry[]>;
  getAllEntries: () => Promise<VectorEntry[]>;
  storeInteraction: (
    userQuery: string,
    systemResponse: string,
    metadata?: InteractionMetadata
  ) => Promise<void>;
  subscribe: (callback: (newEntry: VectorEntry) => void) => () => void;
}