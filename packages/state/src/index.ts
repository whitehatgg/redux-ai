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
  private actionTrace: TAction[] = [];

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;

    // Add middleware to track actions
    const originalDispatch = this.store.dispatch;
    this.store.dispatch = ((action: TAction) => {
      this.actionTrace.push(action);
      return originalDispatch(action);
    }) as typeof this.store.dispatch;
  }

  async processQuery(query: string) {
    try {
      const state = this.store.getState();
      console.log('Current state:', state);

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Previous interactions:', previousInteractions);

      // Analyze state and action history to infer the next action
      const actionInfo = this.inferActionFromHistory(query);
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

  private inferActionFromHistory(query: string): { action: TAction; message: string } | null {
    try {
      const lowerQuery = query.toLowerCase();

      // Get unique action types from history
      const uniqueActions = Array.from(new Set(this.actionTrace.map(action => action.type)));
      console.log('Available actions from history:', uniqueActions);

      // Find similar actions based on the query
      for (const actionType of uniqueActions) {
        const [slice, actionName] = actionType.split('/');

        if (!slice || !actionName) continue;

        // Match action patterns
        if (this.matchesActionPattern(lowerQuery, actionName)) {
          // Use Array.prototype.find instead of findLast for better compatibility
          const lastSimilarAction = [...this.actionTrace]
            .reverse()
            .find((a: TAction) => a.type === actionType);

          if (lastSimilarAction) {
            return {
              action: {
                type: actionType,
                payload: lastSimilarAction.payload
              } as TAction,
              message: `Executing ${actionName} on ${slice}`
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in inferActionFromHistory:', error);
      return null;
    }
  }

  private matchesActionPattern(query: string, actionName: string): boolean {
    // Common action word mappings
    const actionMappings: Record<string, string[]> = {
      'increment': ['increase', 'increment', 'add', 'plus'],
      'decrement': ['decrease', 'decrement', 'subtract', 'minus'],
      'set': ['set', 'change', 'update', 'modify'],
      'reset': ['reset', 'clear', 'zero'],
      'toggle': ['toggle', 'switch', 'flip']
    };

    // Find all possible word variations for this action
    const actionWords = Object.entries(actionMappings)
      .find(([key]) => actionName.toLowerCase().includes(key))?.[1] || [];

    return actionWords.some(word => query.includes(word));
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