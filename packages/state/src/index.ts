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

export interface ReduxAIAction {
  type: string;
  description: string;
  keywords: string[];
}

export interface AIStateConfig<TState, TAction extends BaseAction> {
  store: Store;
  schema?: ReduxAISchema<TAction>;
  vectorStorage: ReduxAIVector;
  availableActions: ReduxAIAction[];
  onError?: (error: Error) => void;
}

export class ReduxAIState<TState, TAction extends BaseAction> {
  private store: Store;
  private schema?: ReduxAISchema<TAction>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private actionTrace: TAction[] = [];

  constructor(config: AIStateConfig<TState, TAction>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions;

    // Add middleware to track actions
    const originalDispatch = this.store.dispatch;
    this.store.dispatch = ((action: TAction) => {
      this.actionTrace.push(action);
      this.storeStateChange(action);
      return originalDispatch(action);
    }) as typeof this.store.dispatch;
  }

  private async storeStateChange(action: TAction) {
    try {
      const state = this.store.getState();
      const stateData = {
        action,
        state,
        timestamp: new Date().toISOString()
      };

      await this.vectorStorage.storeInteraction(
        `Action: ${action.type}`,
        JSON.stringify(stateData),
        JSON.stringify(stateData)
      );

      console.log('Stored state change:', {
        action: action.type,
        state: stateData
      });
    } catch (error) {
      console.error('Error storing state change:', error);
    }
  }

  async processQuery(query: string) {
    try {
      const state = this.store.getState();
      console.log('Processing query:', query);

      // Check if this is a state query
      if (query.toLowerCase().includes('value') || query.toLowerCase().includes('state')) {
        const stateInfo = await this.getStateInfo(query);
        return {
          message: stateInfo,
          action: null
        };
      }

      // Get previous interactions for context
      const previousInteractions = await this.vectorStorage.retrieveSimilar(query, 5);
      console.log('Previous similar interactions:', previousInteractions);

      // Analyze state and action history to infer the next action
      const actionInfo = this.inferActionFromKeywords(query);
      console.log('Inferred action:', actionInfo);

      if (actionInfo) {
        // Store pre-action state
        const preActionState = this.store.getState();

        // Dispatch the action
        this.store.dispatch(actionInfo.action);
        console.log('Action dispatched:', actionInfo.action);

        // Get post-action state and store the interaction
        const postActionState = this.store.getState();

        const stateData = {
          action: actionInfo.action,
          preState: preActionState,
          postState: postActionState,
          timestamp: new Date().toISOString()
        };

        // Store the interaction with full context
        await this.vectorStorage.storeInteraction(
          query,
          actionInfo.message,
          JSON.stringify(stateData)
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

  private async getStateInfo(query: string): Promise<string> {
    const currentState = this.store.getState();
    const interactions = await this.vectorStorage.retrieveSimilar(query, 5);

    // Format current state info
    const stateInfo = Object.entries(currentState.demo || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    // Include history if available
    const history = interactions
      .map(entry => {
        try {
          const data = JSON.parse(entry.state);
          if (data.state?.demo) {
            return `At ${data.timestamp}: counter was ${data.state.demo.counter}`;
          }
          return null;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .join('\n');

    return `Current state: ${stateInfo}\n\nHistory:\n${history}`;
  }

  private inferActionFromKeywords(query: string): { action: TAction; message: string } | null {
    try {
      const lowerQuery = query.toLowerCase();
      console.log('Matching query against available actions:', lowerQuery);

      // Find an action whose keywords match the query
      const matchedAction = this.availableActions.find(action =>
        action.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))
      );

      console.log('Matched action:', matchedAction);

      if (matchedAction) {
        return {
          action: { type: matchedAction.type } as TAction,
          message: matchedAction.description
        };
      }

      return null;
    } catch (error) {
      console.error('Error in inferActionFromKeywords:', error);
      return null;
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