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

export interface AIStateConfig<TState, TAction extends Action> {
  store: Store;
  schema?: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  availableActions: ReduxAIAction[];
  onError?: (error: Error) => void;
  onActionMatch?: (query: string, context: string) => Promise<{ action: TAction; message: string } | null>;
}

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private onActionMatch?: (query: string, context: string) => Promise<{ action: TAction; message: string } | null>;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions;
    this.onActionMatch = config.onActionMatch;
  }

  private async getContext(query: string) {
    try {
      const chatHistory = await this.vectorStorage.retrieveSimilar(query, 3, 'chat_history');
      const stateChanges = await this.vectorStorage.retrieveSimilar(query, 3, 'state_changes');

      return JSON.stringify({
        chatHistory: chatHistory.map(entry => JSON.parse(entry.data)),
        stateChanges: stateChanges.map(entry => JSON.parse(entry.data)),
        currentState: this.store.getState(),
        availableActions: this.availableActions
      });
    } catch (error) {
      console.error('Error getting context:', error);
      return null;
    }
  }

  private async storeInteraction(query: string, response: string, metadata: any, collection: string) {
    try {
      await this.vectorStorage.storeInteraction(
        query,
        response,
        JSON.stringify({ ...metadata, timestamp: new Date().toISOString() }),
        collection
      );
    } catch (error) {
      console.error(`Error storing ${collection} interaction:`, error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error(`Failed to store ${collection}`));
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
      await this.storeInteraction(query, '', { query }, 'chat_history');

      // Process with LLM using context
      if (this.onActionMatch && context) {
        const result = await this.onActionMatch(query, context);

        if (!result) {
          const message = 'I could not determine an appropriate response based on the context.';
          await this.storeInteraction(query, message, { query, response: message }, 'chat_history');
          return { message, action: null };
        }

        const { action, message } = result;

        // If there's an action, validate and execute it
        if (action && typeof action === 'object' && 'type' in action) {
          const isValidAction = this.availableActions.some(
            availableAction => availableAction.type === action.type
          );

          if (isValidAction) {
            // Store state change and dispatch action
            await this.storeInteraction(
              query,
              message,
              { query, action, message, context },
              'state_changes'
            );

            this.store.dispatch(action);
          }
        }

        // Store the response in chat history
        await this.storeInteraction(
          query,
          message,
          { query, response: message, action },
          'chat_history'
        );

        return { message, action: action && isValidAction ? action : null };
      }

      const message = 'No action matching handler configured.';
      await this.storeInteraction(query, message, { query, error: message }, 'chat_history');
      return { message, action: null };

    } catch (error) {
      console.error('Error in processQuery:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      await this.storeInteraction(query, errorMessage, { query, error: errorMessage }, 'chat_history');
      throw error;
    }
  }

  async getSimilarInteractions(query: string, limit: number = 5, collection: string = 'chat_history') {
    try {
      console.log('Retrieving similar interactions for query:', query);
      const interactions = await this.vectorStorage.retrieveSimilar(query, limit, collection);
      console.log('Retrieved interactions:', interactions);
      return interactions;
    } catch (error) {
      console.error('Error getting similar interactions:', error);
      throw error;
    }
  }
}

// Singleton instance
let instance: ReduxAIState<any, Action> | null = null;

export const createReduxAIState = async <TState, TAction extends Action>(
  config: AIStateConfig<TState, TAction>
): Promise<ReduxAIState<TState, TAction>> => {
  try {
    instance = new ReduxAIState(config);
    return instance as ReduxAIState<TState, TAction>;
  } catch (error) {
    console.error('Error creating ReduxAIState:', error);
    throw error;
  }
};

export const getReduxAI = <TState, TAction extends Action>(): ReduxAIState<TState, TAction> => {
  if (!instance) {
    throw new Error('ReduxAI not initialized');
  }
  return instance as ReduxAIState<TState, TAction>;
};