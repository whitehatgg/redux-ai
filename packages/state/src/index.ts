import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector } from "@redux-ai/vector";

export interface AIStateConfig<TState, TAction extends Action> {
  store: Store<TState>;
  schema: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  onError?: (error: Error) => void;
}

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store<TState>;
  private schema: ReduxAISchema<TAction>;
  private machine;
  private onError?: (error: Error) => void;
  private vectorStorage: ReduxAIVector;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.onError = config.onError;
    this.vectorStorage = config.vectorStorage;
  }

  async processQuery(query: string) {
    try {
      const state = this.store.getState();
      const response = await this.generateAIResponse(query, state);

      if (response.action) {
        // Validate action against schema before dispatching
        if (!this.schema.validateAction(response.action)) {
          throw new Error('Invalid action format returned from AI');
        }
        this.store.dispatch(response.action);
      }

      // Store interaction in vector storage
      await this.vectorStorage.storeInteraction(
        query,
        response.message,
        JSON.stringify(state, null, 2)
      );

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
  }

  async getSimilarInteractions(query: string, limit: number = 5) {
    return this.vectorStorage.retrieveSimilar(query, limit);
  }

  private async generateAIResponse(query: string, state: TState): Promise<{
    message: string;
    action: TAction | null;
  }> {
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          state
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        message: data.message,
        action: data.action,
      };
    } catch (error) {
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createReduxAIState = <TState, TAction extends Action>(
  config: AIStateConfig<TState, TAction>
) => {
  return new ReduxAIState<TState, TAction>(config);
};