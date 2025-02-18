import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector } from "@redux-ai/vector";

// Define base action type that includes optional payload and index signature
interface BaseAction extends Action {
  payload?: any;
  [key: string]: any;
}

export interface ReduxAIAction {
  type: string;
  description: string;
  keywords: string[];
}

export interface AIStateConfig<TState, TAction extends BaseAction> {
  store: Store;
  schema?: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  availableActions: ReduxAIAction[];
  onError?: (error: Error) => void;
  onActionMatch?: (query: string) => { action: TAction; message: string } | null;
}

export class ReduxAIState<TState, TAction extends BaseAction> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private onActionMatch?: (query: string) => { action: TAction; message: string } | null;
  private actionTrace: TAction[] = [];
  private lastUserQuery: string = '';

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions;
    this.onActionMatch = config.onActionMatch;

    // Add middleware to track actions
    const originalDispatch = this.store.dispatch;
    this.store.dispatch = ((action: TAction) => {
      this.actionTrace.push(action);
      this.storeStateChange(action);
      return originalDispatch(action);
    }) as typeof this.store.dispatch;
  }

  private async storeStateChange(action: TAction) {
    try {
      const state = this.store.getState();
      const stateData = {
        type: 'STATE_CHANGE',
        action: {
          type: action.type,
          payload: action.payload
        },
        state,
        timestamp: new Date().toISOString()
      };

      await this.vectorStorage.storeInteraction(
        action.type,
        JSON.stringify(stateData),
        JSON.stringify(stateData)
      );

    } catch (error) {
      console.error('Error storing state change:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Failed to store state change'));
      }
    }
  }

  async processQuery(query: string) {
    try {
      console.log('Processing query:', query);
      this.lastUserQuery = query;

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Previous similar interactions:', previousInteractions);

      // Use client-provided action matching function
      if (this.onActionMatch) {
        const actionInfo = this.onActionMatch(query);
        if (actionInfo) {
          // Store the interaction and dispatch the action
          const stateData = {
            query,
            action: actionInfo.action,
            message: actionInfo.message,
            timestamp: new Date().toISOString()
          };

          // Dispatch the action
          this.store.dispatch(actionInfo.action);

          // Store the interaction
          await this.vectorStorage.storeInteraction(
            query,
            actionInfo.message,
            JSON.stringify(stateData)
          );

          return actionInfo;
        }
      }

      return {
        message: 'I could not determine an appropriate action for your request.',
        action: null
      };

    } catch (error) {
      console.error('Error in processQuery:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
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
let instance: ReduxAIState<any, BaseAction> | null = null;

export const createReduxAIState = async <TState, TAction extends BaseAction>(
  config: AIStateConfig<TState, TAction>
): Promise<ReduxAIState<TState, TAction>> => {
  try {
    instance = new ReduxAIState(config) as ReduxAIState<any, BaseAction>;
    return instance as ReduxAIState<TState, TAction>;
  } catch (error) {
    console.error('Error creating ReduxAIState:', error);
    throw error;
  }
};

export const getReduxAI = <TState, TAction extends BaseAction>(): ReduxAIState<TState, TAction> => {
  if (!instance) {
    throw new Error('ReduxAI not initialized');
  }
  return instance as ReduxAIState<TState, TAction>;
};