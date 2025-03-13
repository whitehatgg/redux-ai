import { type Store, type UnknownAction } from '@reduxjs/toolkit';
import { type ReduxAIVector } from '@redux-ai/vector';
import { interpret } from 'xstate';
import { createConversationMachine } from './machine';
import type { AIStateConfig } from './types';
import type { ActorRefFrom } from 'xstate';
import type { MessageIntent } from './machine';

export interface AIResponse {
  message: string;
  action: UnknownAction | null;
  reasoning?: string[];
  intent?: MessageIntent;
  workflow?: AIResponse[];
}

export interface AIStateConfigWithService extends AIStateConfig {
  machineService?: ActorRefFrom<ReturnType<typeof createConversationMachine>>;
}

export class ReduxAIState {
  private store: Store;
  private actions: Record<string, unknown>;
  private storage: ReduxAIVector;
  private onError?: (error: Error) => void;
  private endpoint: string;
  protected debug: boolean = false;
  private conversationService;

  constructor(config: AIStateConfigWithService) {
    this.store = config.store;
    this.actions = config.actions;
    this.storage = config.storage;
    this.onError = config.onError;
    this.endpoint = config.endpoint;
    this.debug = config.debug || false;

    if (config.machineService) {
      this.conversationService = config.machineService;
    } else {
      const machine = createConversationMachine();
      this.conversationService = interpret(machine).start();
    }
  }

  async processQuery(query: string): Promise<AIResponse> {
    try {
      // Add user query to chat first
      this.conversationService.send({ type: 'QUERY', query });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          state: this.store.getState(),
          actions: this.actions
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json() as AIResponse;

      if (!result || typeof result.message !== 'string') {
        throw new Error('Invalid response format: missing message');
      }

      // Store interaction
      await this.storage.storeInteraction(query, result.message, {
        query,
        response: result.message,
        timestamp: Date.now(),
        intent: result.intent as MessageIntent,
        reasoning: result.reasoning || [],
        action: result.action ? { type: result.action.type } : undefined
      });

      // Send response to chat
      this.conversationService.send({ 
        type: 'RESPONSE', 
        message: result.message,
        intent: result.intent as MessageIntent
      });

      // For workflow intent, process each step
      if (result.intent === 'workflow' && Array.isArray(result.workflow)) {
        // Start workflow processing
        this.conversationService.send({ 
          type: 'WORKFLOW_START', 
          steps: result.workflow.map(step => ({ message: step.message }))
        });

        // Process each step
        for (const step of result.workflow) {
          await this.storage.storeInteraction(query, step.message, {
            query,
            response: step.message,
            timestamp: Date.now(),
            intent: step.intent as MessageIntent,
            reasoning: step.reasoning || [],
            action: step.action ? { type: step.action.type } : undefined
          });

          // If step has an action, dispatch it
          if (step.action && 'type' in step.action) {
            this.store.dispatch(step.action);
          }

          // Send step message to chat
          this.conversationService.send({ 
            type: 'RESPONSE', 
            message: step.message,
            intent: step.intent as MessageIntent
          });

          // Move to next step
          this.conversationService.send({ type: 'NEXT_STEP' });
        }
      } else if (result.action && 'type' in result.action) {
        this.store.dispatch(result.action);
      }

      return result;
    } catch (error) {
      if (this.onError && error instanceof Error) {
        this.onError(error);
      }
      throw error;
    }
  }
}

export const createReduxAIState = (config: AIStateConfigWithService): ReduxAIState => {
  return new ReduxAIState(config);
};

export type { AIStateConfig };
export { createConversationMachine };

export type {
  StepStatus,
  WorkflowStep,
  WorkflowContext,
  ConversationMessage,
  ConversationContext,
  ConversationEvent,
  MessageIntent
} from './machine';