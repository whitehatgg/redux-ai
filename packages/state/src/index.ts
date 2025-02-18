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
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
  }

  async processQuery(query: string) {
    try {
      const state = this.store.getState();
      console.log('Current state before processing:', state);

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Previous interactions:', previousInteractions);

      // Infer action from query and state
      const actionInfo = this.inferActionFromState(query, state);
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

  private inferActionFromState(query: string, currentState: TState): { action: TAction; message: string } | null {
    try {
      const lowerQuery = query.toLowerCase();

      // Extract slice names and their state values
      const stateSlices = Object.entries(currentState);

      for (const [sliceName, sliceState] of stateSlices) {
        // Handle each type of state value
        if (typeof sliceState === 'object') {
          for (const [key, value] of Object.entries(sliceState)) {
            const actionInfo = this.createActionForState(sliceName, key, value, lowerQuery);
            if (actionInfo) {
              return actionInfo;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in inferActionFromState:', error);
      return null;
    }
  }

  private createActionForState(
    sliceName: string,
    key: string,
    value: any,
    query: string
  ): { action: TAction; message: string } | null {
    // Handle numeric values
    if (typeof value === 'number') {
      if (query.includes('increase') || query.includes('increment')) {
        return {
          action: {
            type: `${sliceName}/increment`
          } as TAction,
          message: `Increasing ${key}`
        };
      }
      if (query.includes('decrease') || query.includes('decrement')) {
        return {
          action: {
            type: `${sliceName}/decrement`
          } as TAction,
          message: `Decreasing ${key}`
        };
      }
      if (query.includes('reset')) {
        return {
          action: {
            type: `${sliceName}/resetCounter`
          } as TAction,
          message: `Resetting ${key}`
        };
      }
    }

    // Handle string values
    if (typeof value === 'string') {
      const setMatch = query.match(new RegExp(`(?:set|change)\\s+(?:the\\s+)?${key}\\s+(?:to\\s+)?["']?([^"']+)["']?`, 'i'));
      if (setMatch) {
        return {
          action: {
            type: `${sliceName}/setMessage`,
            payload: setMatch[1]
          } as TAction,
          message: `Setting ${key} to: ${setMatch[1]}`
        };
      }
    }

    return null;
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