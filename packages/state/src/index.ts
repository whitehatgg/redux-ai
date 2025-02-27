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

      const similarEntries = await this.storage.retrieveSimilar(query, 3);
      const conversations = similarEntries
        .map(entry => `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`)
        .join('\n\n');

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

      if (result.action) {
        // Validate basic action structure
        if (!result.action.type || typeof result.action.type !== 'string') {
          throw new Error('Invalid action: missing or invalid type');
        }

        // Split action type into namespace and action name
        const [namespace] = result.action.type.split('/');
        if (!namespace) {
          throw new Error(`Invalid action type format: ${result.action.type}`);
        }

        // Check if the action namespace exists in the schema
        if (!this.actions.properties || !this.actions.properties[namespace]) {
          throw new Error(`Invalid action namespace: ${namespace}`);
        }

        // At this point, the action is validated against our schema
        this.store.dispatch(result.action);
      }

      await this.storage.storeInteraction(query, result.message, state);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error; // Re-throw the error to maintain existing behavior
    }
  }
}

export const createReduxAIState = (config: AIStateConfig): ReduxAIState => {
  return new ReduxAIState(config);
};
