import { validateSchema } from '@redux-ai/schema';
import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';

export interface AIStateConfig {
  store: Store;
  actions: Record<string, unknown>;
  storage: ReduxAIVector;
  endpoint: string;
  onError?: (error: Error) => void;
}

interface AIResponse {
  message: string;
  action: Record<string, unknown> | null;
  intent?: string; // Added intent field
}

export class ReduxAIState {
  private store: Store;
  private actions: Record<string, unknown>;
  private storage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private endpoint: string;

  constructor(config: AIStateConfig) {
    this.store = config.store;
    this.actions = config.actions;
    this.storage = config.storage;
    this.onError = config.onError;
    this.endpoint = config.endpoint;
  }

  private handleError(error: Error): AIResponse {
    if (this.onError) {
      this.onError(error);
    }
    return {
      message: 'Error processing request',
      action: null,
    };
  }

  async processQuery(query: string): Promise<AIResponse> {
    try {
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

      // Validate and dispatch action if present
      if (result.action) {
        const validationResult = validateSchema(result.action, this.actions);
        if (!validationResult.valid) {
          return this.handleError(
            new Error(`Invalid action: ${validationResult.errors?.map(e => e.message).join(', ')}`)
          );
        }
        this.store.dispatch(result.action);
      }

      // Store conversation data with intent and action if available
      await this.storage.storeInteraction(query, result.message, {
        intent: result.intent,
        action: result.action,
      });

      return result;
    } catch (error) {
      return this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const createReduxAIState = (config: AIStateConfig): ReduxAIState => {
  return new ReduxAIState(config);
};