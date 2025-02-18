import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector } from "@redux-ai/vector";

export interface ReduxAIAction {
  type: string;
  description: string;
  keywords: string[];
}

export interface AIStateConfig<TState> {
  store: Store;
  schema?: ReduxAISchema<Action>;
  vectorStorage: ReduxAIVector;
  availableActions: ReduxAIAction[];
  onError?: (error: Error) => void;
}

export class ReduxAIState<TState> {
  private store: Store;
  private schema?: ReduxAISchema<Action>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];

  constructor(config: AIStateConfig<TState>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions || [];
  }

  private async getContext(query: string) {
    try {
      return JSON.stringify({
        currentState: this.store.getState(),
        availableActions: this.availableActions
      });
    } catch (error) {
      console.error('Error getting context:', error);
      return null;
    }
  }

  async processQuery(query: string) {
    try {
      console.log('Processing query:', query);

      // Get context from vector DB
      const context = await this.getContext(query);
      console.log('Retrieved context:', context);

      if (!context) {
        throw new Error('Failed to get context for query.');
      }

      // Make API call to process the query
      const apiResponse = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          state: this.store.getState(),
          availableActions: this.availableActions
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.statusText}`);
      }

      const result = await apiResponse.json();
      console.log('API Response:', result);

      const { message, action } = result;

      if (!message) {
        throw new Error('Invalid response format from API');
      }

      // If an action was returned, dispatch it
      if (action) {
        console.log('Dispatching action:', action);
        this.store.dispatch(action);
      }

      return { message, action };

    } catch (error) {
      console.error('Error in processQuery:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
  }
}

// Singleton instance
let instance: ReduxAIState<any> | null = null;

export const createReduxAIState = async <TState>(
  config: AIStateConfig<TState>
): Promise<ReduxAIState<TState>> => {
  try {
    instance = new ReduxAIState(config);
    return instance as ReduxAIState<TState>;
  } catch (error) {
    console.error('Error creating ReduxAIState:', error);
    throw error;
  }
};

export const getReduxAI = <TState>(): ReduxAIState<TState> => {
  if (!instance) {
    throw new Error('ReduxAI not initialized');
  }
  return instance as ReduxAIState<TState>;
};