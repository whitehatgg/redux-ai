import type { ReduxAISchema } from '@redux-ai/schema';
import type { ReduxAIVector } from '@redux-ai/vector';
import type { Action, Store } from '@reduxjs/toolkit';

import { createConversationMachine } from './machine';
import { generateSystemPrompt } from './prompts';

export { generateSystemPrompt } from './prompts';

export interface ReduxAIAction {
  type: string;
  description: string;
  keywords: string[];
}

export interface AIStateConfig {
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

export class ReduxAIState {
  private store: Store;
  private schema?: ReduxAISchema<Action>;
  private machine;
  private vectorStorage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private availableActions: ReduxAIAction[];
  private interactions: Interaction[] = [];
  private initialized: boolean = false;

  constructor(config: AIStateConfig) {
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

    // Any async initialization can go here
    this.initialized = true;
  }

  private async storeInteraction(query: string, response: string) {
    try {
      const interaction: Interaction = {
        query,
        response,
        timestamp: new Date().toISOString(),
      };

      this.interactions.push(interaction);

      // Store the current state along with the interaction
      const currentState = this.store.getState();
      await this.vectorStorage.storeInteraction(query, response, currentState);
    } catch (error) {
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Unknown error storing interaction'));
      }
    }
  }

  async processQuery(query: string) {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    if (!this.initialized) {
      await this.initialize();
    }

    // Get similar queries from vector storage
    let conversationHistory = '';
    try {
      const similarEntries = await this.vectorStorage.retrieveSimilar(query, 3);
      conversationHistory = similarEntries
        .map(entry => `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`)
        .join('\n\n');
    } catch {
      // Continue without vector DB results if there's an error
    }

    // Generate system prompt with conversation history
    const systemPrompt = generateSystemPrompt(
      this.store.getState(),
      this.availableActions,
      conversationHistory
    );

    const requestBody = {
      query,
      prompt: systemPrompt,
      availableActions: this.availableActions,
      currentState: this.store.getState(),
    };

    const apiResponse = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
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
      this.store.dispatch(action);
    }

    return { message, action };
  }
}

let instance: ReduxAIState | null = null;

export const createReduxAIState = async (config: AIStateConfig): Promise<ReduxAIState> => {
  if (instance) {
    return instance;
  }

  instance = new ReduxAIState(config);
  await instance.initialize();
  return instance;
};

export const getReduxAI = (): ReduxAIState => {
  if (!instance) {
    throw new Error('ReduxAI not initialized. Call createReduxAIState first.');
  }
  return instance;
};