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
  private static instanceCount = 0;
  private instanceId: number;

  constructor(config: AIStateConfig<TState>) {
    ReduxAIState.instanceCount++;
    this.instanceId = ReduxAIState.instanceCount;
    console.log(`[ReduxAIState ${this.instanceId}] Initializing...`);

    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions || [];
  }

  private async storeInteraction(query: string, response: string) {
    console.log(`[ReduxAIState ${this.instanceId}] Storing interaction:`, {
      query: query?.substring(0, 50),
      response: response?.substring(0, 50),
      stack: new Error().stack
    });

    try {
      const interaction: Interaction = {
        query,
        response,
        timestamp: new Date().toISOString()
      };

      this.interactions.push(interaction);
      console.log(`[ReduxAIState ${this.instanceId}] Added to local cache`);

      // Instead of using addEntry directly, use storeInteraction which is designed for this purpose
      await this.vectorStorage.storeInteraction(query, response, this.store.getState());

      console.log(`[ReduxAIState ${this.instanceId}] Successfully stored in vector storage`);
    } catch (error) {
      console.error(`[ReduxAIState ${this.instanceId}] Error storing:`, error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown error storing interaction'));
      }
    }
  }

  async processQuery(query: string) {
    console.log(`[ReduxAIState ${this.instanceId}] Processing query:`, query);

    try {
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
      console.log(`[ReduxAIState ${this.instanceId}] API Response:`, result);

      const { message, action } = result;

      if (!message) {
        throw new Error('Invalid response format from API');
      }

      // First store the interaction
      await this.storeInteraction(query, message);

      // Then dispatch the action if provided
      if (action) {
        console.log(`[ReduxAIState ${this.instanceId}] Dispatching action:`, action);
        this.store.dispatch(action);
      }

      return { message, action };

    } catch (error) {
      console.error(`[ReduxAIState ${this.instanceId}] Error:`, error);
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
    console.log('[ReduxAIState] Creating new instance...');
    instance = new ReduxAIState(config);
    return instance as ReduxAIState<TState>;
  } catch (error) {
    console.error('[ReduxAIState] Creation error:', error);
    throw error;
  }
};

export const getReduxAI = <TState>(): ReduxAIState<TState> => {
  if (!instance) {
    throw new Error('ReduxAI not initialized');
  }
  return instance as ReduxAIState<TState>;
};