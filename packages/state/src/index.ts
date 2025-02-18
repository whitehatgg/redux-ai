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
    const state = this.store.getState();
    const availableActions: Array<{ type: string; description: string }> = [];

    // Examine the state structure to find slices
    Object.keys(state).forEach(sliceName => {
      const slice = (state as any)[sliceName];
      // Look for standard Redux Toolkit action types
      const actionTypes = [
        'increment',
        'decrement',
        'setMessage',
        'resetCounter'
      ].map(action => ({
        type: `${sliceName}/${action}`,
        description: `${action} action for ${sliceName}`
      }));

      availableActions.push(...actionTypes);
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

  private matchActionFromQuery(query: string, availableActions: Array<{ type: string; description: string }>) {
    const lowerQuery = query.toLowerCase();

    // Handle increment/increase
    if (lowerQuery.includes('increment') || lowerQuery.includes('increase')) {
      return { type: 'demo/increment' } as TAction;
    }

    // Handle decrement/decrease
    if (lowerQuery.includes('decrement') || lowerQuery.includes('decrease')) {
      return { type: 'demo/decrement' } as TAction;
    }

    // Handle reset
    if (lowerQuery.includes('reset')) {
      return { type: 'demo/resetCounter' } as TAction;
    }

    // Handle set message
    if (lowerQuery.includes('set') && lowerQuery.includes('message')) {
      const messageMatch = query.match(/message\s+(?:to\s+)?["']?([^"']+)["']?/i);
      if (messageMatch) {
        return {
          type: 'demo/setMessage',
          payload: messageMatch[1]
        } as unknown as TAction;
      }
    }

    // Handle set counter to specific number
    if (lowerQuery.includes('set') && lowerQuery.includes('counter')) {
      const numberMatch = query.match(/\d+/);
      if (numberMatch) {
        // For now, we'll use increment/decrement to reach the target
        const targetNumber = parseInt(numberMatch[0]);
        const currentState = this.store.getState() as any;
        const currentCounter = currentState.demo.counter;

        if (targetNumber > currentCounter) {
          return { type: 'demo/increment' } as TAction;
        } else if (targetNumber < currentCounter) {
          return { type: 'demo/decrement' } as TAction;
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
          message: `Executing action: ${action.type}`,
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
let _reduxAI: ReduxAIState<any, any> | null = null;

export const createReduxAIState = async <TState, TAction extends Action>(
  config: AIStateConfig<TState, TAction>
): Promise<ReduxAIState<TState, TAction>> => {
  try {
    _reduxAI = new ReduxAIState<TState, TAction>(config);
    return _reduxAI;
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