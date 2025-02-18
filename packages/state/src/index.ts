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
      await this.vectorStorage.storeInteraction(query, response, this.store.getState());
    } catch (error) {
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown error storing interaction'));
      }
    }
  }

  async processQuery(query: string) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const conversationHistory = this.interactions
        .map(interaction => `User: ${interaction.query}\nAssistant: ${interaction.response}`)
        .join('\n');

      const systemPrompt = generateSystemPrompt(
        this.store.getState(),
        this.availableActions,
        conversationHistory
      );

      console.log('[ReduxAIState] Sending request:', {
        promptLength: systemPrompt.length,
        actionsCount: this.availableActions.length,
        query
      });

      const apiResponse = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `
            System: You are a Redux state management assistant. Your primary task is to help users manage column visibility in the applicant table.

            When a user asks to hide/disable a column:
            1. Get the current visible columns
            2. Remove only the specified column
            3. Keep all other columns visible
            4. Be specific in your response about which column you're hiding

            Current actions available: ${JSON.stringify(this.availableActions)}.
            Current conversation history: ${conversationHistory}

            User query: ${query}

            Respond with a JSON object containing:
            1. A 'message' field specifying exactly which column you're modifying
            2. An 'action' field with the Redux action to dispatch

            Example responses:
            For "disable name":
            {
              "message": "I'll hide the 'name' column in the table",
              "action": {
                "type": "applicant/setVisibleColumns",
                "payload": ["email", "status", "position", "appliedDate"]
              }
            }

            For "disable status":
            {
              "message": "I'll hide the 'status' column in the table",
              "action": {
                "type": "applicant/setVisibleColumns",
                "payload": ["name", "email", "position", "appliedDate"]
              }
            }
          `,
          availableActions: this.availableActions
        }),
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