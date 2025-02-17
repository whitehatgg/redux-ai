import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";

export interface AIStateConfig<TState, TAction extends Action> {
  store: Store<TState>;
  schema: ReduxAISchema<TAction>;
  onError?: (error: Error) => void;
}

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store<TState>;
  private schema: ReduxAISchema<TAction>;
  private machine;
  private onError?: (error: Error) => void;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.onError = config.onError;
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

      return response.message;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
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
          state,
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