import type { Store } from '@reduxjs/toolkit';
import type { ReduxAIVector } from '@redux-ai/vector';

import type { AIStateConfig } from './types';

export interface AIResponse {
  message: string;
  action: Record<string, unknown> | null;
  reasoning?: string[];
  intent?: string;
}

export class ReduxAIState {
  private store: Store;
  private actions: Record<string, unknown>;
  private storage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private endpoint: string;
  private debug: boolean = false;

  constructor(config: AIStateConfig) {
    this.store = config.store;
    this.actions = config.actions;
    this.storage = config.storage;
    this.onError = config.onError;
    this.endpoint = config.endpoint;
    this.debug = config.debug || false;
  }

  async processQuery(query: string): Promise<AIResponse> {
    try {
      const state = this.store.getState();
      const recentEntries = await this.storage.retrieveSimilar("", 10);
      const similarEntries = await this.storage.retrieveSimilar(query, 5);

      const conversations = [...recentEntries, ...similarEntries]
        .sort((a, b) => b.timestamp - a.timestamp)
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

      if (!result || typeof result.message !== 'string') {
        throw new Error('Invalid response format: missing message');
      }

      const metadata = {
        query,
        response: result.message,
        timestamp: Date.now(),
        intent: result.intent,
        action: result.action,
        reasoning: result.reasoning,
      };

      await this.storage.storeInteraction(query, result.message, metadata);

      if (result.action && result.action.type) {
        if (this.debug) {
          console.debug('[ReduxAIState] Dispatching action:', result.action);
        }
        try {
          this.store.dispatch(result.action);
          if (this.debug) {
            console.debug('[ReduxAIState] Action dispatched successfully');
          }
        } catch (dispatchError) {
          console.error('[ReduxAIState] Failed to dispatch action:', dispatchError);
          throw dispatchError;
        }
      }

      return {
        message: result.message,
        action: result.action || null,
        reasoning: result.reasoning,
        intent: result.intent,
      };

    } catch (error: unknown) {
      if (error instanceof Error) {
        if (this.onError) {
          this.onError(error);
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }
}

export const createReduxAIState = (config: AIStateConfig): ReduxAIState => {
  return new ReduxAIState(config);
};

export type { AIStateConfig };