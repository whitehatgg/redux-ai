import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector, VectorEntry } from "@redux-ai/vector";

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

export interface Interaction {
  query: string;
  response: string;
  timestamp: string;
}

export class ReduxAIState<TState> {
  private store: Store;
  private schema?: ReduxAISchema<Action>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private interactions: Interaction[] = [];

  constructor(config: AIStateConfig<TState>) {
    console.log('[ReduxAIState] Starting initialization');
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions || [];
    console.log('[ReduxAIState] Initialization complete');
  }

  private async storeInteraction(query: string, response: string) {
    try {
      console.log('[ReduxAIState] Storing interaction:', { query });
      const interaction: Interaction = {
        query,
        response,
        timestamp: new Date().toISOString()
      };

      this.interactions.push(interaction);
      await this.vectorStorage.storeInteraction(query, response, this.store.getState());
      console.log('[ReduxAIState] Interaction stored successfully');
    } catch (error) {
      console.error('[ReduxAIState] Error storing interaction:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown error storing interaction'));
      }
    }
  }

  async processQuery(query: string) {
    try {
      console.log('[ReduxAIState] Processing query:', query);
      const apiResponse = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          state: this.store.getState(),
          availableActions: this.availableActions,
          previousInteractions: this.interactions
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.statusText}`);
      }

      const result = await apiResponse.json();
      const { message, action } = result;

      if (!message) {
        throw new Error('Invalid response format from API');
      }

      await this.storeInteraction(query, message);

      if (action) {
        this.store.dispatch(action);
      }

      return { message, action };

    } catch (error) {
      console.error('[ReduxAIState] Error in processQuery:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
  }
}

let instance: ReduxAIState<any> | null = null;

export const createReduxAIState = async <TState>(
  config: AIStateConfig<TState>
): Promise<ReduxAIState<TState>> => {
  try {
    console.log('[ReduxAIState] Creating new instance');
    instance = new ReduxAIState(config);
    console.log('[ReduxAIState] Instance created successfully');
    return instance as ReduxAIState<TState>;
  } catch (error) {
    console.error('[ReduxAIState] Error creating ReduxAIState:', error);
    throw error;
  }
};

export const getReduxAI = <TState>(): ReduxAIState<TState> => {
  if (!instance) {
    console.error('[ReduxAIState] Attempting to access uninitialized instance');
    throw new Error('ReduxAI not initialized');
  }
  return instance as ReduxAIState<TState>;
};