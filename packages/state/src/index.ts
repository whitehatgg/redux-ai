import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector } from "@redux-ai/vector";

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
        // If schema is provided, validate action
        if (this.schema && !this.schema.validateAction(response.action)) {
          throw new Error('Invalid action format returned from AI');
        }

        // Store the pre-action state
        const preActionState = JSON.stringify(this.store.getState(), null, 2);
        console.log('Pre-action state:', preActionState);

        // Dispatch the action
        this.store.dispatch(response.action);
        console.log('Action dispatched:', response.action);

        // Get post-action state and store the interaction
        const postActionState = JSON.stringify(this.store.getState(), null, 2);
        console.log('Post-action state:', postActionState);
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
    return this.vectorStorage.retrieveSimilar(query, limit);
  }

  private async generateAIResponse(query: string, state: TState, previousInteractions: any[]): Promise<{
    message: string;
    action: TAction | null;
  }> {
    try {
      // Get all available action creators from the store
      const availableActions = Object.keys(this.store.dispatch)
        .filter(key => typeof this.store.dispatch[key as keyof typeof this.store.dispatch] === 'function')
        .map(key => ({
          type: `${key}`,
          description: `Action creator for ${key}`
        }));

      console.log('Available actions:', availableActions);
      console.log('Previous interactions:', previousInteractions);

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          state,
          availableActions,
          previousInteractions
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Response data:', data);
      return {
        message: data.message,
        action: data.action,
      };
    } catch (error) {
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createReduxAIState = async <TState, TAction extends Action>(
  config: AIStateConfig<TState, TAction>
) => {
  if (_reduxAI) {
    return _reduxAI as ReduxAIState<TState, TAction>;
  }

  _reduxAI = new ReduxAIState<TState, TAction>(config);

  // Store initial state in vector storage
  const initialState = config.store.getState();
  await config.vectorStorage.storeInteraction(
    'Initial State',
    'Redux store initialized with initial state',
    JSON.stringify(initialState, null, 2)
  );

  return _reduxAI;
};

export const getReduxAI = () => {
  if (!_reduxAI) {
    throw new Error('ReduxAI not initialized');
  }
  return _reduxAI;
};