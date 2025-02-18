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
  private isProcessing = false;

  constructor(config: AIStateConfig<TState>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions || [];
    console.log('ReduxAIState: Initialized with vector storage:', this.vectorStorage);
  }

  private async storeInteraction(query: string, response: string) {
    if (this.isProcessing) {
      console.log('ReduxAIState: Skipping duplicate storeInteraction call');
      return;
    }

    console.log('ReduxAIState: Starting storeInteraction', { query, response });
    this.isProcessing = true;

    try {
      const interaction: Interaction = {
        query,
        response,
        timestamp: new Date().toISOString()
      };

      this.interactions.push(interaction);
      console.log('ReduxAIState: Added interaction to local cache');

      // Only store in vector database, no need to dispatch additional actions
      await this.vectorStorage.addEntry({
        content: JSON.stringify(interaction),
        metadata: {
          type: 'interaction',
          timestamp: interaction.timestamp,
          state: JSON.stringify(this.store.getState())
        }
      });
      console.log('ReduxAIState: Successfully stored interaction in vector storage');
    } catch (error) {
      console.error('ReduxAIState: Error storing interaction:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown error storing interaction'));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async getRelevantHistory(query: string): Promise<Interaction[]> {
    try {
      console.log('ReduxAIState: Retrieving relevant history for query:', query);
      const results = await this.vectorStorage.search({
        query,
        limit: 5
      });
      console.log('ReduxAIState: Retrieved history results:', results.length);
      return results.map((result: VectorEntry) => JSON.parse(result.content));
    } catch (error) {
      console.error('ReduxAIState: Error retrieving conversation history:', error);
      return [];
    }
  }

  private async getContext(query: string) {
    try {
      console.log('ReduxAIState: Building context for query:', query);
      const relevantHistory = await this.getRelevantHistory(query);

      return JSON.stringify({
        currentState: this.store.getState(),
        availableActions: this.availableActions,
        previousInteractions: relevantHistory
      });
    } catch (error) {
      console.error('ReduxAIState: Error getting context:', error);
      return null;
    }
  }

  async processQuery(query: string) {
    if (this.isProcessing) {
      console.log('ReduxAIState: Skipping duplicate processQuery call');
      return;
    }

    this.isProcessing = true;
    console.log('ReduxAIState: Starting processQuery:', query);

    try {
      const context = await this.getContext(query);

      if (!context) {
        throw new Error('Failed to get context for query.');
      }

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
      console.log('ReduxAIState: Received API response:', result);

      const { message, action } = result;

      if (!message) {
        throw new Error('Invalid response format from API');
      }

      // Store the interaction first
      await this.storeInteraction(query, message);

      // Then dispatch the Redux action
      if (action) {
        console.log('ReduxAIState: Dispatching action:', action);
        this.store.dispatch(action);
      }

      return { message, action };

    } catch (error) {
      console.error('ReduxAIState: Error in processQuery:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

let instance: ReduxAIState<any> | null = null;

export const createReduxAIState = async <TState>(
  config: AIStateConfig<TState>
): Promise<ReduxAIState<TState>> => {
  try {
    console.log('Creating ReduxAIState instance...');
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