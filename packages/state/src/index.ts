import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector, VectorConfig } from "@redux-ai/vector";

export interface AIStateConfig<TState, TAction extends Action> {
  store: Store;
  schema?: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  onError?: (error: Error) => void;
}

export class ReduxAIState<TState, TAction extends Action> {
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

  private getAvailableActions(): Array<{ type: string; description: string }> {
    const state = this.store.getState();
    const availableActions: Array<{ type: string; description: string }> = [];

    // Get slice names from the root state
    Object.keys(state).forEach(sliceName => {
      // Get the reducer object for this slice
      const reducer = (this.store as any)._reducers[sliceName];
      if (reducer && typeof reducer === 'object') {
        // Get action creators from slice reducers
        const sliceActions = Object.keys(reducer.reducers || {});
        sliceActions.forEach(actionName => {
          availableActions.push({
            type: `${sliceName}/${actionName}`,
            description: `${actionName} action for ${sliceName} slice`
          });
        });
      }
    });

    console.log('Available actions:', availableActions);
    return availableActions;
  }

  async processQuery(query: string) {
    try {
      const state = this.store.getState();
      console.log('Current state before processing:', state);

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Retrieved previous interactions:', previousInteractions);

      const response = await this.generateAIResponse(query, state, previousInteractions);
      console.log('AI Response:', response);

      if (response.action) {
        console.log('Dispatching action:', response.action);

        // Store the pre-action state
        const preActionState = this.store.getState();

        // Dispatch the action
        this.store.dispatch(response.action);

        // Get post-action state and store the interaction
        const postActionState = this.store.getState();
        await this.vectorStorage.storeInteraction(
          query,
          response.message,
          JSON.stringify({
            action: response.action,
            preState: preActionState,
            postState: postActionState
          })
        );

        // Log state changes
        console.log('State changes:', {
          pre: preActionState,
          post: postActionState
        });
      }

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in processQuery:', errorMessage);
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
  }

  private matchActionFromQuery(query: string, availableActions: Array<{ type: string; description: string }>): TAction | null {
    const lowerQuery = query.toLowerCase();

    // Find action that best matches the query
    for (const action of availableActions) {
      const actionType = action.type.toLowerCase();
      const actionParts = actionType.split('/')[1]; // Get the action name without slice prefix

      // Handle various action patterns
      if (
        (lowerQuery.includes('increment') || lowerQuery.includes('increase')) && actionParts.includes('increment') ||
        (lowerQuery.includes('decrement') || lowerQuery.includes('decrease')) && actionParts.includes('decrement') ||
        (lowerQuery.includes('reset') && actionParts.includes('reset')) ||
        (lowerQuery.includes(actionParts))
      ) {
        // Special handling for setMessage action
        if (actionParts === 'setmessage') {
          const messageMatch = query.match(/message\s+(?:to\s+)?["']?([^"']+)["']?/i);
          if (messageMatch) {
            return {
              type: action.type,
              payload: messageMatch[1]
            } as TAction;
          }
        } else {
          // For simple actions without payload
          return { type: action.type } as TAction;
        }
      }
    }

    return null;
  }

  private async generateAIResponse(query: string, state: TState, previousInteractions: any[]): Promise<{
    message: string;
    action: TAction | null;
  }> {
    try {
      const availableActions = this.getAvailableActions();
      console.log('Available actions:', availableActions);
      console.log('Previous interactions:', previousInteractions);
      console.log('Current state:', state);
      console.log('User query:', query);

      // Match the query to an available action
      const action = this.matchActionFromQuery(query, availableActions);
      console.log('Matched action:', action);

      if (action) {
        return {
          message: `Executing action: ${action.type}${action.payload ? ` with payload: ${action.payload}` : ''}`,
          action
        };
      }

      return {
        message: 'Could not determine appropriate action for query',
        action: null
      };
    } catch (error) {
      console.error('Error in generateAIResponse:', error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSimilarInteractions(query: string, limit: number = 5): Promise<any[]> {
    try {
      const results = await this.vectorStorage.retrieveSimilar(query, limit);
      console.log('Retrieved similar interactions:', results);
      return results;
    } catch (error) {
      console.error('Error getting similar interactions:', error);
      throw error;
    }
  }
}

// Singleton instance
let _instance: ReduxAIState<any, any> | null = null;

export const createReduxAIState = async <TState, TAction extends Action>(
  config: AIStateConfig<TState, TAction>
): Promise<ReduxAIState<TState, TAction>> => {
  try {
    _instance = new ReduxAIState<TState, TAction>(config);
    return _instance;
  } catch (error) {
    console.error('Error creating ReduxAIState:', error);
    throw error;
  }
};

export const getReduxAI = <TState, TAction extends Action>(): ReduxAIState<TState, TAction> => {
  if (!_instance) {
    throw new Error('ReduxAI not initialized');
  }
  return _instance as ReduxAIState<TState, TAction>;
};