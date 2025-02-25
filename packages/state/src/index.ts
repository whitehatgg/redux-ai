import { BaseAction, validateSchema, s } from '@redux-ai/schema';
import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import { generateSystemPrompt } from './prompts';
import type { StateUpdateEvent } from './types';
import { safeStringify } from './utils';

export interface AIStateConfig {
  store: Store;
  schema: ReturnType<typeof s.object>;
  vectorStorage: ReduxAIVector;
  apiEndpoint: string;
  onError?: (error: Error) => void;
}

export class ReduxAIState {
  private store: Store;
  private schema: ReturnType<typeof s.object>;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private apiEndpoint: string;

  constructor(config: AIStateConfig) {
    this.store = config.store;
    this.schema = config.schema;
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.apiEndpoint = config.apiEndpoint;
  }

  async processQuery(query: string) {
    if (!query) {
      throw this.handleError(new Error('Query is required'));
    }

    try {
      const similarEntries = await this.vectorStorage.retrieveSimilar(query, 3);
      const conversationHistory = similarEntries
        .map(entry => `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`)
        .join('\n\n');

      const state = this.store.getState();
      const prompt = generateSystemPrompt(state, this.schema, conversationHistory);

      const apiResponse = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, prompt }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw this.handleError(
          new Error(`API request failed: ${apiResponse.status} - ${errorText}`)
        );
      }

      const result = await apiResponse.json();
      const { message, action } = result;

      if (!message) {
        throw this.handleError(new Error('Invalid response format from API'));
      }

      // Directly dispatch action without validation
      if (action) {
        this.store.dispatch(action as BaseAction);
      }

      await this.vectorStorage.storeInteraction(query, message, state);

      return { message, action };
    } catch (error) {
      throw this.handleError(error, 'Failed to process query');
    }
  }

  private handleError(error: unknown, message?: string): Error {
    const wrappedError =
      error instanceof Error ? error : new Error(message || 'Unknown error occurred');

    if (this.onError) {
      this.onError(wrappedError);
    }
    return wrappedError;
  }
}

export const createReduxAIState = (config: AIStateConfig): ReduxAIState => {
  return new ReduxAIState(config);
};

export type { BaseAction, StateUpdateEvent };
export { generateSystemPrompt } from './prompts';