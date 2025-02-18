import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector, VectorConfig } from "@redux-ai/vector";

// Define base action type that includes optional payload and index signature
interface BaseAction extends Action {
  payload?: any;
  [key: string]: any;
}

export interface AIStateConfig<TState, TAction extends BaseAction> {
  store: Store;
  schema?: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  onError?: (error: Error) => void;
}

export class ReduxAIState<TState, TAction extends BaseAction> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private onError?: (error: Error) => void;
  private vectorStorage: ReduxAIVector;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.onError = config.onError;
    this.vectorStorage = config.vectorStorage;
  }

  async processQuery(query: string) {
    try {
      const state = this.store.getState();
      console.log('Current state before processing:', state);

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Retrieved previous interactions:', previousInteractions);

      // Infer action from query and schema
      const actionInfo = await this.inferActionFromQuery(query, state);
      console.log('Inferred action:', actionInfo);

      if (actionInfo) {
        // Store pre-action state
        const preActionState = this.store.getState();

        // Dispatch the action
        this.store.dispatch(actionInfo.action);
        console.log('Action dispatched:', actionInfo.action);

        // Get post-action state and store the interaction
        const postActionState = this.store.getState();
        await this.vectorStorage.storeInteraction(
          query,
          actionInfo.message,
          JSON.stringify({
            action: actionInfo.action,
            preState: preActionState,
            postState: postActionState
          })
        );

        return {
          message: actionInfo.message,
          action: actionInfo.action
        };
      }

      return {
        message: 'Unable to determine appropriate action for your request.',
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

  private async inferActionFromQuery(query: string, currentState: TState): Promise<{ action: TAction; message: string } | null> {
    try {
      const lowerQuery = query.toLowerCase();
      const stateKeys = Object.keys(currentState);

      // Get available actions from schema if provided
      const availableActions = this.schema?.actions || [];
      console.log('Available actions from schema:', availableActions);

      // Pattern match the query against state keys and available actions
      for (const key of stateKeys) {
        const stateValue = (currentState as any)[key];

        // Match numeric operations
        if (typeof stateValue === 'number') {
          if (lowerQuery.includes('increase') || lowerQuery.includes('increment')) {
            return {
              action: { 
                type: `${key}/increment`,
                payload: 1 
              } as TAction,
              message: `Increasing ${key}`
            };
          }
          if (lowerQuery.includes('decrease') || lowerQuery.includes('decrement')) {
            return {
              action: { 
                type: `${key}/decrement`,
                payload: 1 
              } as TAction,
              message: `Decreasing ${key}`
            };
          }
          if (lowerQuery.includes('reset')) {
            return {
              action: { 
                type: `${key}/reset`,
                payload: 0 
              } as TAction,
              message: `Resetting ${key}`
            };
          }
        }

        // Match string operations
        if (typeof stateValue === 'string') {
          const setMatch = query.match(new RegExp(`(?:set|change)\\s+(?:the\\s+)?${key}\\s+(?:to\\s+)?["']?([^"']+)["']?`, 'i'));
          if (setMatch) {
            return {
              action: { 
                type: `${key}/set`,
                payload: setMatch[1] 
              } as TAction,
              message: `Setting ${key} to: ${setMatch[1]}`
            };
          }
        }

        // Match boolean operations
        if (typeof stateValue === 'boolean') {
          if (lowerQuery.includes('toggle') && lowerQuery.includes(key.toLowerCase())) {
            return {
              action: { 
                type: `${key}/toggle`
              } as TAction,
              message: `Toggling ${key}`
            };
          }
        }
      }

      // If no pattern match found, try schema-defined actions
      if (this.schema) {
        // Schema-based action inference logic would go here
        // This could involve more sophisticated NLP or pattern matching
        // based on the schema definitions
      }

      return null;
    } catch (error) {
      console.error('Error inferring action:', error);
      return null;
    }
  }

  async getSimilarInteractions(query: string, limit: number = 5) {
    try {
      return await this.vectorStorage.retrieveSimilar(query, limit);
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