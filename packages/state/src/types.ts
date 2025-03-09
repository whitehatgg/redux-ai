import type { BaseAction } from '@redux-ai/schema';
import type { Store } from '@reduxjs/toolkit';
import type { ReduxAIVector } from '@redux-ai/vector';

export interface AIStateConfig {
  store: Store;
  actions: Record<string, unknown>;
  storage: ReduxAIVector;
  endpoint: string;
  onError?: (error: Error) => void;
  debug?: boolean;
}

export type { BaseAction };