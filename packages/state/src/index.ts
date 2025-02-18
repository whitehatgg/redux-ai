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

    // Validate available actions
    this.availableActions.forEach(action => {
      if (!action || typeof action.type !== 'string') {
        throw new Error('Invalid action configuration: each action must have a type property');
      }
    });
  }

  private isValidAction(action: any): action is Action {
    return action && 
           typeof action === 'object' && 
           'type' in action && 
           typeof action.type === 'string' &&
           this.availableActions.some(availableAction => availableAction.type === action.type);
  }

  private async getContext(query: string) {
    try {
      const chatHistory = await this.vectorStorage.retrieveSimilar(query, 3);
      const stateChanges = await this.vectorStorage.retrieveSimilar(query, 3);

      return JSON.stringify({
        chatHistory: chatHistory.map(entry => ({ query: entry.query, response: entry.response })),
        stateChanges: stateChanges.map(entry => ({ query: entry.query, state: entry.state })),
        currentState: this.store.getState(),
        availableActions: this.availableActions
      });
    } catch (error) {
      console.error('Error getting context:', error);
      return null;
    }
  }

  private async storeInteraction(query: string, response: string, metadata: any) {
    try {
      await this.vectorStorage.storeInteraction(
        query,
        response,
        metadata
      );
    } catch (error) {
      console.error('Error storing interaction:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Failed to store interaction'));
      }
    }
  }

  async processQuery(query: string) {
    try {
      console.log('Processing query:', query);

      // Get context from vector DB
      const context = await this.getContext(query);
      console.log('Retrieved context:', context);

      // Store the initial query
      await this.storeInteraction(query, '', { query });

      if (!context) {
        const message = 'Failed to get context for query.';
        await this.storeInteraction(query, message, { query, error: message });
        return { message, action: null };
      }

      // The LLM will use the context to determine the appropriate action
      // This includes the currentState, chatHistory, and availableActions

      // For now, return null action since we don't have LLM integration yet
      const message = 'Action matching will be handled by LLM integration';
      await this.storeInteraction(query, message, { query, message });
      return { message, action: null };

    } catch (error) {
      console.error('Error in processQuery:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      await this.storeInteraction(query, errorMessage, { query, error: errorMessage });
      throw error;
    }
  }

  async getSimilarInteractions(query: string, limit: number = 5) {
    try {
      console.log('Retrieving similar interactions for query:', query);
      const interactions = await this.vectorStorage.retrieveSimilar(query, limit);
      console.log('Retrieved interactions:', interactions);
      return interactions;
    } catch (error) {
      console.error('Error getting similar interactions:', error);
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