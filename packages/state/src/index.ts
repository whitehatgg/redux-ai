import { BaseAction, validateSchema, s } from '@redux-ai/schema';
import type { ReduxAIVector } from '@redux-ai/vector';
import type { Store, UnknownAction } from '@reduxjs/toolkit';
import { generateSystemPrompt } from './prompts';
import type { StateUpdateEvent } from './types';

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
    try {
      if (!query?.trim()) {
        return this.handleError('Query is required');
      }

      const state = this.store.getState();
      const similarEntries = await this.vectorStorage.retrieveSimilar(query, 3);
      const conversationHistory = similarEntries
        .map(entry => `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`)
        .join('\n\n');

      const prompt = generateSystemPrompt(state, this.schema, conversationHistory);

      const apiResponse = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, prompt, currentState: state })
      });

      if (!apiResponse.ok) {
        return this.handleError('Failed to process request. Please try again.');
      }

      const result = await apiResponse.json();

      if (!result?.message) {
        return {
          message: "I couldn't understand that request. Could you rephrase it?",
          action: null
        };
      }

      if (result.action) {
        // Cast to UnknownAction to satisfy Redux dispatch type
        this.store.dispatch(result.action as UnknownAction);
      }

      await this.vectorStorage.storeInteraction(query, result.message, state);

      return result;

    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): { message: string; action: null } {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (this.onError) {
      this.onError(new Error(errorMessage));
    }

    return {
      message: "I encountered an issue processing your request. Please try again.",
      action: null
    };
  }
}

export const createReduxAIState = (config: AIStateConfig): ReduxAIState => {
  return new ReduxAIState(config);
};

export type { BaseAction, StateUpdateEvent };
export { generateSystemPrompt } from './prompts';