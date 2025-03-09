export interface ReduxAIAction {
  type: string;
  payload?: unknown;
}

// Core vector entry type for storing vector data
export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
  timestamp: number;
}

// Comprehensive metadata type for vector entries
export interface VectorMetadata {
  query?: string;
  response?: string;
  intent?: string;
  action?: Record<string, unknown>;
  reasoning?: string[];
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
  addEntry: (data: { vector: number[]; metadata: VectorMetadata }) => Promise<void>;
  retrieveSimilar: (searchQuery: string, resultLimit?: number) => Promise<VectorEntry[]>;
  getAllEntries: () => Promise<VectorEntry[]>;
  storeInteraction: (
    userQuery: string,
    systemResponse: string,
    metadata?: Partial<VectorMetadata>
  ) => Promise<void>;
  subscribe: (callback: (newEntry: VectorEntry) => void) => () => void;
}

// Export the InteractionMetadata type
export type InteractionMetadata = Partial<VectorMetadata>;