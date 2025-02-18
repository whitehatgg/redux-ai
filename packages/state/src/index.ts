import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector, VectorConfig } from "@redux-ai/vector";

// Define base action type that includes optional payload and index signature
interface BaseAction extends Action {
  payload?: any;
  [key: string]: any; // Add index signature to satisfy UnknownAction constraint
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

      // Match action from query
      const actionInfo = this.matchActionFromQuery(query);
      console.log('Matched action:', actionInfo);

      if (actionInfo) {
        // Store the pre-action state
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

  private matchActionFromQuery(query: string): { action: TAction; message: string } | null {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('increment') || lowerQuery.includes('increase')) {
      return {
        action: { type: 'demo/increment' } as TAction,
        message: 'Incrementing the counter'
      };
    }

    if (lowerQuery.includes('decrement') || lowerQuery.includes('decrease')) {
      return {
        action: { type: 'demo/decrement' } as TAction,
        message: 'Decrementing the counter'
      };
    }

    if (lowerQuery.includes('reset')) {
      return {
        action: { type: 'demo/resetCounter' } as TAction,
        message: 'Resetting the counter to zero'
      };
    }

    const messageMatch = query.match(/(?:set|change)\s+(?:the\s+)?message\s+(?:to\s+)?["']?([^"']+)["']?/i);
    if (messageMatch) {
      return {
        action: { type: 'demo/setMessage', payload: messageMatch[1] } as TAction,
        message: `Setting message to: ${messageMatch[1]}`
      };
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