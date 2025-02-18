import { createMachine } from "xstate";
import { createConversationMachine } from "./machine";
import { configureStore, createSlice, PayloadAction, Store, Action } from "@reduxjs/toolkit";
import { ReduxAISchema } from "@redux-ai/schema";
import { ReduxAIVector, VectorEntry } from "@redux-ai/vector";
import { generateSystemPrompt, generateActionExamples } from './prompts';

// Export the prompt generation functions
export { generateSystemPrompt, generateActionExamples } from './prompts';

export interface ReduxAIAction {
  type: string;
  description: string;
  keywords: string[];
}

export interface AIStateConfig<TState> {
  store: Store;
  schema?: ReduxAISchema<Action>;
  vectorStorage: ReduxAIVector;
  availableActions: ReduxAIAction[];
  onError?: (error: Error) => void;
}

export interface Interaction {
  query: string;
  response: string;
  timestamp: string;
}

export class ReduxAIState<TState> {
  private store: Store;
  private schema?: ReduxAISchema<Action>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private interactions: Interaction[] = [];
  private initialized: boolean = false;

  constructor(config: AIStateConfig<TState>) {
    this.store = config.store;
    this.schema = config.schema;
    this.machine = createConversationMachine();
    this.vectorStorage = config.vectorStorage;
    this.onError = config.onError;
    this.availableActions = config.availableActions || [];
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Any async initialization can go here
      this.initialized = true;
      console.log('[ReduxAIState] Initialization complete');
    } catch (error) {
      console.error('[ReduxAIState] Initialization failed:', error);
      throw error;
    }
  }

  private async storeInteraction(query: string, response: string) {
    try {
      const interaction: Interaction = {
        query,
        response,
        timestamp: new Date().toISOString()
      };

      this.interactions.push(interaction);

      // Store the current state along with the interaction
      const currentState = this.store.getState();
      await this.vectorStorage.storeInteraction(
        query, 
        response,
        currentState
      );

      console.log('[ReduxAIState] Stored interaction:', {
        query,
        response,
        timestamp: interaction.timestamp
      });

    } catch (error) {
      console.error('[ReduxAIState] Error storing interaction:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown error storing interaction'));
      }
    }
  }

  async processQuery(query: string) {
    try {
      if (!this.initialized) {
        console.log('[ReduxAIState] Initializing before first query');
        await this.initialize();
      }

      console.log('[ReduxAIState] Raw query received:', query);

      // Reset conversation history for each new query
      const conversationHistory = '';

      const systemPrompt = generateSystemPrompt(
        this.store.getState(),
        this.availableActions,
        conversationHistory
      );

      console.log('[ReduxAIState] Processing query:', {
        query,
        promptLength: systemPrompt.length,
        actionsCount: this.availableActions.length,
        state: JSON.stringify(this.store.getState()).slice(0, 200) 
      });

      const requestBody = {
        prompt: systemPrompt,
        query,  
        availableActions: this.availableActions,
        currentState: this.store.getState()
      };

      console.log('[ReduxAIState] Sending request body:', JSON.stringify(requestBody).slice(0, 200));

      const apiResponse = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('[ReduxAIState] API request failed:', {
          status: apiResponse.status,
          error: errorText
        });
        throw new Error(`API request failed: ${apiResponse.status} - ${errorText}`);
      }

      const result = await apiResponse.json();
      const { message, action } = result;

      if (!message) {
        throw new Error('Invalid response format from API');
      }

      // Store the interaction before dispatching action
      await this.storeInteraction(query, message);

      if (action) {
        console.log('[ReduxAIState] Dispatching action:', action);
        this.store.dispatch(action);
      }

      return { message, action };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('[ReduxAIState] Error in processQuery:', errorMessage);
      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
      throw error;
    }
  }
}

let instance: ReduxAIState<any> | null = null;

export const createReduxAIState = async <TState>(
  config: AIStateConfig<TState>
): Promise<ReduxAIState<TState>> => {
  if (instance) {
    return instance as ReduxAIState<TState>;
  }

  try {
    instance = new ReduxAIState(config);
    await instance.initialize();
    return instance;
  } catch (error) {
    console.error('[createReduxAIState] Failed to create instance:', error);
    throw error;
  }
};

export const getReduxAI = <TState>(): ReduxAIState<TState> => {
  if (!instance) {
    throw new Error('ReduxAI not initialized. Call createReduxAIState first.');
  }
  return instance as ReduxAIState<TState>;
};