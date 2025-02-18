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
      } else {
        // Store the interaction even if no action was taken
        await this.vectorStorage.storeInteraction(
          query,
          response.message,
          JSON.stringify(this.store.getState(), null, 2)
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

  private async generateAIResponse(query: string, state: TState, previousInteractions: any[]): Promise<{
    message: string;
    action: TAction | null;
  }> {
    try {
      // Get all available action creators from the demo slice
      const availableActions = [
        {
          type: 'demo/increment',
          description: 'Increment the counter by 1'
        },
        {
          type: 'demo/decrement',
          description: 'Decrement the counter by 1'
        },
        {
          type: 'demo/setMessage',
          description: 'Set a message in the state'
        },
        {
          type: 'demo/resetCounter',
          description: 'Reset the counter to 0'
        }
      ];

      console.log('Available actions:', availableActions);
      console.log('Previous interactions:', previousInteractions);
      console.log('Current state:', state);
      console.log('User query:', query);

      // Simple action mapping based on query
      let action: TAction | null = null;
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes('increment') || lowerQuery.includes('increase')) {
        action = { type: 'demo/increment' } as TAction;
      } else if (lowerQuery.includes('decrement') || lowerQuery.includes('decrease')) {
        action = { type: 'demo/decrement' } as TAction;
      } else if (lowerQuery.includes('reset')) {
        action = { type: 'demo/resetCounter' } as TAction;
      } else if (lowerQuery.includes('set') && lowerQuery.includes('counter')) {
        const number = parseInt(query.match(/\d+/)?.[0] || '0', 10);
        // We'll use multiple increments/decrements to reach the target number
        const currentValue = (state as any).demo.counter || 0;
        if (number > currentValue) {
          for (let i = 0; i < number - currentValue; i++) {
            this.store.dispatch({ type: 'demo/increment' } as TAction);
          }
        } else {
          for (let i = 0; i < currentValue - number; i++) {
            this.store.dispatch({ type: 'demo/decrement' } as TAction);
          }
        }
        action = null; // Already dispatched actions
      }

      return {
        message: action ? `Successfully executed ${action.type}` : 'Query processed successfully',
        action
      };
    } catch (error) {
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