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
  onActionMatch?: (query: string) => Promise<{ action: TAction; message: string } | null>;
}

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private onActionMatch?: (query: string) => Promise<{ action: TAction; message: string } | null>;

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

  private isInformationalQuery(query: string): boolean {
    const informationalPatterns = [
      /^(?:what|show|tell\s+me)\s+(?:was|is|are|were)\s+(?:my|the|our)\s+(?:last|previous|recent)/i,
      /^(?:list|display|show)\s+(?:all|recent|previous)/i,
      /^(?:can\s+you\s+)?(?:remind|tell)\s+me\s+(?:about|what)/i,
      /^(?:history|log|record)s?\s+of/i,
    ];

    return informationalPatterns.some(pattern => pattern.test(query));
  }

  private async handleInformationalQuery(query: string) {
    // Try to find relevant interactions from chat history
    const chatHistory = await this.vectorStorage.retrieveSimilar(query, 3, 'chat_history');

    if (chatHistory.length > 0) {
      const latestInteraction = JSON.parse(chatHistory[0].data);
      return {
        message: `Based on your history: "${latestInteraction.query}" - ${latestInteraction.response}`,
        action: null
      };
    }

    // If no chat history, check state changes
    const stateChanges = await this.vectorStorage.retrieveSimilar(query, 3, 'state_changes');

    if (stateChanges.length > 0) {
      const latestChange = JSON.parse(stateChanges[0].data);
      return {
        message: `Last state change was: ${latestChange.message}`,
        action: null
      };
    }

    return {
      message: "I couldn't find any relevant history for your query.",
      action: null
    };
  }

  async processQuery(query: string) {
    try {
      console.log('Processing query:', query);

      // Store the query in chat history first
      await this.storeInteraction(query, '', { query }, 'chat_history');

      // Determine if this is an informational query
      if (this.isInformationalQuery(query)) {
        const result = await this.handleInformationalQuery(query);
        // Update the stored chat interaction with the response
        await this.storeInteraction(query, result.message, { query, response: result.message }, 'chat_history');
        return result;
      }

      // If not informational, try to match an action
      if (this.onActionMatch) {
        const actionInfo = await this.onActionMatch(query);

        if (!actionInfo) {
          const message = 'I could not determine an appropriate action for your request.';
          await this.storeInteraction(query, message, { query, response: message }, 'chat_history');
          return { message, action: null };
        }

        const { action, message } = actionInfo;

        // Validate action structure
        if (!action || typeof action !== 'object' || !('type' in action)) {
          const errorMessage = 'Unable to process that action.';
          await this.storeInteraction(query, errorMessage, { query, error: errorMessage }, 'chat_history');
          return { message: errorMessage, action: null };
        }

        // Validate action type against available actions
        const isValidAction = this.availableActions.some(
          availableAction => availableAction.type === action.type
        );

        if (!isValidAction) {
          const errorMessage = 'Unable to perform that action.';
          await this.storeInteraction(query, errorMessage, { query, error: errorMessage }, 'chat_history');
          return { message: errorMessage, action: null };
        }

        // Store the state change
        await this.storeInteraction(
          query,
          message,
          { query, action, message },
          'state_changes'
        );

        // Dispatch the action
        this.store.dispatch(action);

        // Update chat history with the success message
        await this.storeInteraction(
          query,
          message,
          { query, response: message, actionType: action.type },
          'chat_history'
        );

        return { action, message };
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