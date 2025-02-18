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

  private async storeStateChange(action: TAction, message: string) {
    try {
      const state = this.store.getState();
      const stateData = {
        type: 'STATE_CHANGE',
        action,
        state,
        timestamp: new Date().toISOString()
      };

      await this.vectorStorage.storeInteraction(
        message,
        JSON.stringify(stateData),
        JSON.stringify(stateData),
        `${action.type}-${Date.now()}` // Add unique key
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

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Previous similar interactions:', previousInteractions);

      // Use client-provided action matching function
      if (this.onActionMatch) {
        const actionInfo = await this.onActionMatch(query);
        if (actionInfo && actionInfo.action && typeof actionInfo.action === 'object' && 'type' in actionInfo.action) {
          // Validate the action type against available actions
          const isValidAction = this.availableActions.some(
            availableAction => availableAction.type === actionInfo.action.type
          );

          if (!isValidAction) {
            console.warn('Invalid action type:', actionInfo.action.type);
            return {
              message: 'Unable to perform that action.',
              action: null
            };
          }

          // Store the interaction with a unique key
          const stateData = {
            query,
            action: actionInfo.action,
            message: actionInfo.message,
            timestamp: new Date().toISOString()
          };

          await this.vectorStorage.storeInteraction(
            query,
            actionInfo.message,
            JSON.stringify(stateData),
            `${query}-${Date.now()}` // Add unique key
          );

          // Store the state change after dispatching
          this.store.dispatch(actionInfo.action);
          await this.storeStateChange(actionInfo.action, actionInfo.message);

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