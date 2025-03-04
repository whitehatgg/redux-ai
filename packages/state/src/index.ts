import { validateSchema } from '@redux-ai/schema';
import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import type { Type } from '@sinclair/typebox';

export interface AIStateConfig {
  store: Store;
  actions: ReturnType<typeof Type.Object>;
  storage: ReduxAIVector;
  endpoint: string;
  onError?: (error: Error) => void;
}

export class ReduxAIState {
  private store: Store;
  private actions: ReturnType<typeof Type.Object>;
  private storage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private endpoint: string;

  constructor(config: AIStateConfig) {
    if (!config.storage) {
      throw new Error('Vector storage is required for ReduxAIState');
    }
    this.store = config.store;
    this.actions = config.actions;
    this.storage = config.storage;
    this.onError = config.onError;
    this.endpoint = config.endpoint;
  }

  async processQuery(query: string) {
    try {
      if (!this.storage) {
        throw new Error('Vector storage not initialized');
      }

      const state = this.store.getState();

      // Retrieve similar entries for context
      const similarEntries = await this.storage.retrieveSimilar(query, 3);
      const conversations = similarEntries
        .map(entry => `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`)
        .join('\n\n');

      // Make API request with context
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          state,
          actions: this.actions,
          conversations,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Validate and dispatch action if present
      if (result.action) {
        const validationResult = validateSchema(result.action, this.actions);
        if (!validationResult.valid) {
          throw new Error(
            'Invalid action: ' + validationResult.errors?.map(e => e.message).join(', ')
          );
        }
        this.store.dispatch(result.action);
      }

      // Store the interaction
      await this.storage.storeInteraction(query, result.message, state);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
  }
}

export const createReduxAIState = (config: AIStateConfig): ReduxAIState => {
  return new ReduxAIState(config);
};
