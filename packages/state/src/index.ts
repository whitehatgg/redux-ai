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
  onActionMatch?: (query: string, context: string) => Promise<{ action: TAction | null; message: string } | null>;
}

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private onActionMatch?: (query: string, context: string) => Promise<{ action: TAction | null; message: string } | null>;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions || [];
    this.onActionMatch = config.onActionMatch;

    // Validate available actions
    this.availableActions.forEach(action => {
      if (!action || typeof action.type !== 'string') {
        throw new Error('Invalid action configuration: each action must have a type property');
      }
    });
  }

  private isValidAction(action: any): action is TAction {
    return action && 
           typeof action === 'object' && 
           'type' in action && 
           typeof action.type === 'string' &&
           this.availableActions.some(availableAction => availableAction.type === action.type);
  }

  private async getContext(query: string) {
    try {
      const chatHistory = await this.vectorStorage.getSimilar(query, 3);
      const stateChanges = await this.vectorStorage.getSimilar(query, 3);

      return JSON.stringify({
        chatHistory: chatHistory.map(entry => entry.metadata),
        stateChanges: stateChanges.map(entry => entry.metadata),
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
      await this.vectorStorage.store(
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

      if (!this.onActionMatch) {
        const message = 'No action matching handler configured.';
        await this.storeInteraction(query, message, { query, error: message });
        return { message, action: null };
      }

      if (!context) {
        const message = 'Failed to get context for query.';
        await this.storeInteraction(query, message, { query, error: message });
        return { message, action: null };
      }

      // Process with LLM using context
      const result = await this.onActionMatch(query, context);

      if (!result) {
        const message = 'Could not determine an appropriate response.';
        await this.storeInteraction(query, message, { query, response: message });
        return { message, action: null };
      }

      const { action, message } = result;

      // If there's an action, validate it
      if (action !== null && !this.isValidAction(action)) {
        const errorMessage = 'Invalid action returned from action matcher.';
        await this.storeInteraction(query, errorMessage, { query, error: errorMessage });
        return { message: errorMessage, action: null };
      }

      // Store the interaction and dispatch valid action
      await this.storeInteraction(
        query,
        message,
        { query, action, message, context }
      );

      if (action) {
        this.store.dispatch(action);
      }

      return { message, action };

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
      const interactions = await this.vectorStorage.getSimilar(query, limit);
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