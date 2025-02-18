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
  private lastUserQuery: string = '';

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
      console.log('Storing state change for action:', action.type);

      if (!this.vectorStorage) {
        console.error('Vector storage not initialized');
        return;
      }

      const stateData = {
        type: 'STATE_CHANGE',
        action: {
          type: action.type,
          payload: action.payload
        },
        state: state.demo,
        timestamp: new Date().toISOString()
      };

      console.log('State data to store:', stateData);

      // Store the interaction with the action type as the key
      await this.vectorStorage.storeInteraction(
        action.type,
        JSON.stringify(stateData),  // Store the full state data as the text
        JSON.stringify(stateData)   // Store the same data as metadata
      );

      console.log('Successfully stored state change:', stateData);
    } catch (error) {
      console.error('Error storing state change:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Failed to store state change'));
      }
    }
  }

  async processQuery(query: string) {
    try {
      const lowerQuery = query.toLowerCase();
      console.log('Processing query:', query);

      // Store the current query
      this.lastUserQuery = query;

      // Handle query about last message
      if (lowerQuery.includes('last message') || lowerQuery.includes('previous message')) {
        return {
          message: `Your last message was: "${this.lastUserQuery}"`,
          action: null
        };
      }

      // Handle state queries
      if (lowerQuery.includes('value') ||
          lowerQuery.includes('counter') ||
          lowerQuery.includes('state')) {
        const stateInfo = await this.getStateInfo(query);
        const queryData = {
          type: 'QUERY',
          query,
          response: stateInfo,
          state: this.store.getState().demo,
          timestamp: new Date().toISOString()
        };

        await this.vectorStorage.storeInteraction(
          query,
          stateInfo,
          JSON.stringify(queryData)
        );

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
    return `Current state: counter = ${currentState.demo.counter}${currentState.demo.message ? `, message = "${currentState.demo.message}"` : ''}`;
  }

  private inferActionFromKeywords(query: string): { action: TAction; message: string } | null {
    try {
      const lowerQuery = query.toLowerCase();
      console.log('Processing query for action matching:', lowerQuery);

      const columnMatch = lowerQuery.match(/show\s+(\w+)(?:\s+(?:and|,)\s+(\w+))?\s*(?:columns?)?/);
      if (columnMatch) {
        const columns = [columnMatch[1], columnMatch[2]].filter(Boolean) as (keyof Applicant)[];
        return {
          action: {
            type: 'applicant/setVisibleColumns',
            payload: columns
          } as TAction,
          message: `Updated visible columns to show: ${columns.join(', ')}`
        };
      }

      const searchMatch = lowerQuery.match(/(?:search|find|look\s+for)\s+(.+)/i);
      if (searchMatch) {
        return {
          action: {
            type: 'applicant/setSearchTerm',
            payload: searchMatch[1].trim()
          } as TAction,
          message: `Searching for: ${searchMatch[1].trim()}`
        };
      }

      // Check against registered actions as fallback
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