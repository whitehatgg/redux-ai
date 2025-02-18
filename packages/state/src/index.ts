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
  onActionMatch?: (query: string, context?: string) => Promise<{ action: TAction; message: string } | null>;
}

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private onActionMatch?: (query: string, context?: string) => Promise<{ action: TAction; message: string } | null>;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions;
    this.onActionMatch = config.onActionMatch;
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

  private async getRelevantContext(query: string) {
    try {
      // Get relevant context from both collections
      const chatHistory = await this.vectorStorage.retrieveSimilar(query, 3, 'chat_history');
      const stateChanges = await this.vectorStorage.retrieveSimilar(query, 3, 'state_changes');

      // Format context for LLM consumption
      const context = {
        chatHistory: chatHistory.map(entry => {
          const data = JSON.parse(entry.data);
          return {
            query: data.query,
            response: data.response,
            timestamp: data.timestamp
          };
        }),
        stateChanges: stateChanges.map(entry => {
          const data = JSON.parse(entry.data);
          return {
            action: data.action,
            message: data.message,
            timestamp: data.timestamp
          };
        })
      };

      return JSON.stringify(context);
    } catch (error) {
      console.error('Error retrieving context:', error);
      return null;
    }
  }

  async processQuery(query: string) {
    try {
      console.log('Processing query:', query);

      // First, get relevant context from vector database
      const context = await this.getRelevantContext(query);
      console.log('Retrieved context:', context);

      // Store the query in chat history
      await this.storeInteraction(query, '', { query }, 'chat_history');

      // If we have an action matcher, try to match an action with context
      if (this.onActionMatch) {
        const actionInfo = await this.onActionMatch(query, context);

        if (!actionInfo) {
          const message = 'I could not determine an appropriate action for your request.';
          await this.storeInteraction(query, message, { query, response: message }, 'chat_history');
          return { message, action: null };
        }

        const { action, message } = actionInfo;

        // Validate action
        if (!action || typeof action !== 'object' || !('type' in action)) {
          const errorMessage = 'Unable to process that action.';
          await this.storeInteraction(query, errorMessage, { query, error: errorMessage }, 'chat_history');
          return { message: errorMessage, action: null };
        }

        // Validate action type
        const isValidAction = this.availableActions.some(
          availableAction => availableAction.type === action.type
        );

        if (!isValidAction) {
          const errorMessage = 'Unable to perform that action.';
          await this.storeInteraction(query, errorMessage, { query, error: errorMessage }, 'chat_history');
          return { message: errorMessage, action: null };
        }

        // Store state change
        await this.storeInteraction(
          query,
          message,
          { query, action, message, context },
          'state_changes'
        );

        // Dispatch action
        this.store.dispatch(action);

        // Update chat history
        await this.storeInteraction(
          query,
          message,
          { query, response: message, actionType: action.type, context },
          'chat_history'
        );

        return { action, message };
      }

      // If no action matcher, respond based on context
      const lastInteraction = context ? JSON.parse(context).chatHistory[0] : null;
      const message = lastInteraction 
        ? `Based on your history: "${lastInteraction.query}" - ${lastInteraction.response}`
        : "I couldn't find any relevant history for your query.";

      await this.storeInteraction(query, message, { query, response: message }, 'chat_history');
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

  async getLastQuery() {
    try {
      const interactions = await this.vectorStorage.retrieveSimilar('', 1, 'chat_history');
      if (interactions.length > 0) {
        const lastInteraction = JSON.parse(interactions[0].data);
        return {
          message: `Your last query was: "${lastInteraction.query}"`,
          action: null
        };
      }
      return {
        message: "You haven't made any queries yet.",
        action: null
      };
    } catch (error) {
      console.error('Error retrieving last query:', error);
      throw error;
    }
  }

  async getSimilarInteractions(query: string, limit: number = 5, collection: string = 'state_changes') {
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
    instance = new ReduxAIState(config) as ReduxAIState<any, Action>;
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