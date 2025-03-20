import { type Store, type UnknownAction } from '@reduxjs/toolkit';
import { type ReduxAIVector } from '@redux-ai/vector';
import { interpret } from 'xstate';
import { createConversationMachine } from './machine';
import { createWorkflowMiddleware } from './middleware';
import type { AIStateConfig } from './types';
import type { ActorRefFrom } from 'xstate';
import type { MessageIntent } from './machine';

export { createWorkflowMiddleware };

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

    const machine = createConversationMachine();
    this.conversationService = config.machineService || interpret(machine).start();
  }

  private async waitForState(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async handleAction(action: UnknownAction | null, sideEffectId?: string): Promise<void> {
    if (!action || !('type' in action)) return;

    try {
      // Dispatch with timeout
      await Promise.race([
        Promise.resolve(this.store.dispatch({ ...action, sideEffectId })),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Side effect timeout')), 5000)
        )
      ]);

      if (sideEffectId) {
        // Signal completion
        this.conversationService.send({
          type: 'SIDE_EFFECT_COMPLETE',
          id: sideEffectId
        });
        await this.waitForState();
      }
    } catch (error) {
      if (sideEffectId) {
        // Handle failure
        this.conversationService.send({
          type: 'SIDE_EFFECT_COMPLETE',
          id: sideEffectId
        });
        await this.waitForState();
      }
      throw error;
    }
  }

  async processQuery(query: string): Promise<AIResponse> {
    try {
      // Start conversation
      this.conversationService.send({ type: 'QUERY', query });
      await this.waitForState();

      // Get API response
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          state: this.store.getState(),
          actions: this.actions
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json() as AIResponse;

      // Store initial interaction
      await this.storage.storeInteraction(query, result.message, {
        query,
        response: result.message,
        timestamp: Date.now(),
        intent: result.intent as MessageIntent,
        reasoning: result.reasoning || []
      });

      if (result.intent === 'workflow' && Array.isArray(result.workflow)) {
        // Initialize workflow
        this.conversationService.send({
          type: 'WORKFLOW_START',
          steps: result.workflow.map(step => ({
            message: step.message,
            sideEffectId: step.action ? `${step.action.type}_${Date.now()}` : undefined
          }))
        });
        await this.waitForState();

        // Process workflow steps
        for (const step of result.workflow) {
          const sideEffectId = step.action ? `${step.action.type}_${Date.now()}` : undefined;

          // Store step state
          await this.storage.storeInteraction(query, step.message, {
            query,
            response: step.message,
            timestamp: Date.now(),
            intent: step.intent as MessageIntent,
            reasoning: step.reasoning || [],
            action: step.action ? { type: step.action.type, sideEffectId } : undefined
          });

          // Start step
          this.conversationService.send({
            type: 'RESPONSE',
            message: step.message,
            intent: step.intent as MessageIntent,
            sideEffectId
          });
          await this.waitForState();

          // Handle action
          if (step.action) {
            await this.handleAction(step.action, sideEffectId);
          }

          // Move to next step
          this.conversationService.send({ type: 'NEXT_STEP' });
          await this.waitForState();
        }
      } else if (result.action) {
        await this.handleAction(result.action);
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

export type { AIStateConfig } from './types';