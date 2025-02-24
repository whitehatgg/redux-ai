import type { ReduxAISchema, ValidationResult } from '@redux-ai/schema';
import type { ReduxAIVector, VectorEntry } from '@redux-ai/vector';
import type { Action, Store } from '@reduxjs/toolkit';

import { generateSystemPrompt } from './prompts';
import type { ReduxAIAction } from './types';

export { generateSystemPrompt } from './prompts';

export interface AIStateConfig {
  store: Store;
  schema?: ReduxAISchema<Action>;
  vectorStorage: ReduxAIVector;
  actions: ReduxAIAction[];
  onError?: (error: Error) => void;
  apiEndpoint: string;
}

export class ReduxAIState {
  private store: Store;
  private schema?: ReduxAISchema<Action>;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private actions: ReduxAIAction[];
  private apiEndpoint: string;

  constructor(config: AIStateConfig) {
    this.store = config.store;
    this.schema = config.schema;
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.actions = config.actions;
    this.apiEndpoint = config.apiEndpoint;
  }

  async processQuery(query: string) {
    if (!query || typeof query !== 'string') {
      throw this.handleError(new Error('Query must be a non-empty string'));
    }

    try {
      const similarEntries = await this.vectorStorage.retrieveSimilar(query, 3);
      const conversationHistory = similarEntries
        .map(
          (entry: VectorEntry) =>
            `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`
        )
        .join('\n\n');

      const systemPrompt = generateSystemPrompt(
        this.store.getState(),
        this.actions,
        conversationHistory
      );

      const requestBody = {
        query,
        prompt: systemPrompt,
        actions: this.actions,
        currentState: this.store.getState(),
      };

      const apiResponse = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

      // Handle the action if provided
      if (action && this.schema) {
        const validationResult: ValidationResult = this.schema.validateAction(action);
        if (!validationResult.valid) {
          const errorMessage = validationResult.errors?.join(', ') || 'Unknown validation error';
          throw this.handleError(new Error(`Invalid action format: ${errorMessage}`));
        }
        this.store.dispatch(action);
      }

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

export type { ReduxAIAction } from './types';
