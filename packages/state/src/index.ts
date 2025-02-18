import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector, VectorConfig } from "@redux-ai/vector";

export interface AIStateConfig<TState, TAction extends Action> {
  store: Store<TState>;
  schema?: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  onError?: (error: Error) => void;
}

let _reduxAI: ReduxAIState<any, any> | null = null;

export class ReduxAIState<TState, TAction extends Action> {
  private store: Store<TState>;
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
    // Extract available actions from the store
    const state = this.store.getState();
    const availableActions: Array<{ type: string; description: string }> = [];

    // Iterate through the store's reducers to find available actions
    Object.entries(this.store.getState()).forEach(([slice, sliceState]) => {
      // Get action creators from the slice
      const sliceActions = Object.keys(
        (this.store as any)._reducers[slice].actions || {}
      ).map(actionName => ({
        type: `${slice}/${actionName}`,
        description: `${actionName} action for ${slice}`
      }));

      availableActions.push(...sliceActions);
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
        const preActionState = JSON.stringify(this.store.getState(), null, 2);

        // Dispatch the action
        this.store.dispatch(response.action);

        // Get post-action state and store the interaction
        const postActionState = JSON.stringify(this.store.getState(), null, 2);
        await this.vectorStorage.storeInteraction(
          query,
          response.message,
          postActionState
        );
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

  async getSimilarInteractions(query: string, limit: number = 5) {
    try {
      const results = await this.vectorStorage.retrieveSimilar(query, limit);
      console.log('Retrieved similar interactions:', results);
      return results;
    } catch (error) {
      console.error('Error getting similar interactions:', error);
      return [];
    }
  }

  private matchActionFromQuery(query: string, availableActions: Array<{ type: string; description: string }>) {
    const lowerQuery = query.toLowerCase();

    // Try to find an exact match first
    const exactMatch = availableActions.find(action => 
      lowerQuery.includes(action.type.toLowerCase()) || 
      lowerQuery.includes(action.description.toLowerCase())
    );

    if (exactMatch) {
      return { type: exactMatch.type } as TAction;
    }

    // Try to match based on keywords
    for (const action of availableActions) {
      const actionWords = action.description.toLowerCase().split(' ');
      const queryWords = lowerQuery.split(' ');

      const hasMatch = actionWords.some(word => 
        queryWords.some(queryWord => 
          queryWord === word || 
          queryWord.includes(word) || 
          word.includes(queryWord)
        )
      );

      if (hasMatch) {
        return { type: action.type } as TAction;
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

      // Add logic to handle numeric values in queries
      if (action) {
        // Store the interaction before dispatching
        await this.vectorStorage.storeInteraction(
          query,
          `Executing action: ${action.type}`,
          JSON.stringify(state, null, 2)
        );

        return {
          message: `Executing action: ${action.type}`,
          action
        };
      }

      // Store interaction even if no action was matched
      await this.vectorStorage.storeInteraction(
        query,
        'Could not determine appropriate action for query',
        JSON.stringify(state, null, 2)
      );

      return {
        message: 'Could not determine appropriate action for query',
        action: null
      };
    } catch (error) {
      console.error('Error in generateAIResponse:', error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createReduxAIState = async <TState, TAction extends Action>(
  config: AIStateConfig<TState, TAction>
): Promise<ReduxAIState<TState, TAction>> => {
  try {
    if (_reduxAI) {
      return _reduxAI as ReduxAIState<TState, TAction>;
    }

    const instance = new ReduxAIState<TState, TAction>(config);
    _reduxAI = instance as ReduxAIState<any, any>;

    // Store initial state in vector storage
    const initialState = config.store.getState();
    await config.vectorStorage.storeInteraction(
      'Initial State',
      'Redux store initialized with initial state',
      JSON.stringify(initialState, null, 2)
    );

    return instance;
  } catch (error) {
    console.error('Error creating ReduxAIState:', error);
    throw error;
  }
};

export const getReduxAI = <TState, TAction extends Action>(): ReduxAIState<TState, TAction> => {
  if (!_reduxAI) {
    throw new Error('ReduxAI not initialized');
  }
  return _reduxAI as ReduxAIState<TState, TAction>;
};