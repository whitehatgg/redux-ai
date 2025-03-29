import { type Store, type UnknownAction } from '@reduxjs/toolkit';
import { type ReduxAIVector } from '@redux-ai/vector';
import { interpret } from 'xstate';
import { createConversationMachine } from './machine';
import type { AIStateConfig } from './types';
import type { ActorRefFrom } from 'xstate';
import type { MessageIntent } from './machine';
import { createEffectTracker, type EffectTrackerOptions } from './middleware';

export interface AIResponse {
  message: string;
  action: UnknownAction | null;
  reasoning?: string[];
  intent?: MessageIntent;
  workflow?: AIResponse[];
}

export interface AIStateConfigWithService extends AIStateConfig, EffectTrackerOptions {
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
  private effectTracker;
  private stepDelay: number;

  constructor(config: AIStateConfigWithService) {
    this.store = config.store;
    this.actions = config.actions;
    this.storage = config.storage;
    this.onError = config.onError;
    this.endpoint = config.endpoint;
    this.debug = config.debug || false;
    this.stepDelay = config.stepDelay || 1500; // Default 1.5 second delay if not specified

    // Create effect tracker
    this.effectTracker = createEffectTracker({
      debug: this.debug,
      timeout: config.timeout || 30000,
      onEffectsCompleted: config.onEffectsCompleted
    });

    if (config.machineService) {
      this.conversationService = config.machineService;
    } else {
      const machine = createConversationMachine();
      this.conversationService = interpret(machine).start();
    }
  }

  /**
   * Waits for all pending side effects to complete
   * @returns Promise<void> that resolves when all effects are completed
   */
  async waitForEffects(): Promise<void> {
    // Wait for all pending side effects to complete
    await this.effectTracker.waitForEffects();
  }

  /**
   * Creates a delay to improve visibility of workflow steps in the UI
   * and ensure any non-tracked side effects have time to complete
   * @param stepDescription Optional description of the current workflow step
   * @returns Promise<void> that resolves after the configured delay
   */
  private async waitForUI(_stepDescription?: string): Promise<void> {
    if (this.stepDelay <= 0) return;
    
    // Add a delay to ensure UI visibility and allow non-tracked side effects to complete
    return new Promise(resolve => setTimeout(resolve, this.stepDelay));
  }
  


  /**
   * Process a user query and handle the response, including dispatching actions
   * and processing workflows with side-effect tracking.
   */
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

      // Reset side effect info before starting new interactions
      this.effectTracker.resetSideEffectInfo();
      
      // Store initial interaction - we'll update it after side effects if there's an action
      const timestamp = Date.now();
      
      if (!result.action) {
        // If there's no action to dispatch, just store the interaction once 
        await this.storage.storeInteraction(query, result.message, {
          query,
          response: result.message,
          timestamp,
          intent: result.intent as MessageIntent,
          reasoning: result.reasoning || [],
        });
      } else {
        // If there's an action, we'll store after executing it to include side effects
        // Initial store with minimal info - this will be overwritten after action execution
        await this.storage.storeInteraction(query, result.message, {
          query,
          response: result.message,
          timestamp,
          intent: result.intent as MessageIntent,
          reasoning: result.reasoning || [],
          action: { type: result.action.type }, 
        });
      }

      // Send response to chat
      this.conversationService.send({ 
        type: 'RESPONSE', 
        message: result.message,
        intent: result.intent as MessageIntent
      });

      // For workflow intent, process each step
      if (result.intent === 'workflow' && Array.isArray(result.workflow)) {
        // Initialize the workflow but with only the first step
        const firstStep = result.workflow[0];
        this.conversationService.send({ 
          type: 'WORKFLOW_START', 
          steps: [{ message: firstStep.message }]
        });
        
        // Process each step with significant delays between them and sequentially adding them to UI
        for (let i = 0; i < result.workflow.length; i++) {
          const step = result.workflow[i];
          const isLastStep = i === result.workflow.length - 1;
          
          // Reset the side effect info for this step
          this.effectTracker.resetSideEffectInfo();
          
          // First, display the step message in the UI
          this.conversationService.send({ 
            type: 'RESPONSE', 
            message: step.message,
            intent: step.intent as MessageIntent
          });
          
          // Then add a delay to ensure the message appears before any action
          await new Promise(resolve => setTimeout(resolve, this.stepDelay));
          
          // If there's an action, execute it
          if (step.action && 'type' in step.action) {
            // Store the information about this step with action
            await this.storage.storeInteraction(query, step.message, {
              query,
              response: step.message,
              timestamp: Date.now(),
              intent: step.intent as MessageIntent,
              reasoning: step.reasoning || [],
              action: { type: step.action.type }
            });
            
            // Dispatch the action
            this.store.dispatch(step.action);
            
            // Wait for all side effects to complete
            await this.waitForEffects();
          } else {
            // For steps without actions, just store the interaction
            await this.storage.storeInteraction(query, step.message, {
              query,
              response: step.message,
              timestamp: Date.now(),
              intent: step.intent as MessageIntent,
              reasoning: step.reasoning || [],
            });
          }
          
          // Add another significant delay after this step completes
          const stepDescription = step.action && 'type' in step.action 
            ? `Completed action: ${step.action.type}` 
            : `Processed step: ${step.message.substring(0, 30)}${step.message.length > 30 ? '...' : ''}`;
          
          await this.waitForUI(stepDescription);
          
          // If there are more steps to come, delay and advance to the next one
          if (!isLastStep) {
            // Move to next step in the state machine
            this.conversationService.send({ type: 'NEXT_STEP' });
            
            // Add the next step to the workflow steps array now
            const nextStep = result.workflow[i+1];
            this.conversationService.send({ 
              type: 'WORKFLOW_START', 
              steps: [{ message: nextStep.message }]
            });
            
            // Add another delay to ensure visual separation
            await new Promise(resolve => setTimeout(resolve, this.stepDelay));
          }
        }
      } else if (result.action && 'type' in result.action) {
        // Dispatch the action
        this.store.dispatch(result.action);
        
        // Wait for side effects to complete
        await this.waitForEffects();
        
        // Add a delay for better UI visibility
        const stepDescription = `Completed action: ${result.action.type}`;
        await this.waitForUI(stepDescription);
        
        // After action is executed, update the interaction without side effect information
        await this.storage.storeInteraction(query, result.message, {
          query,
          response: result.message,
          timestamp: Date.now(),
          intent: result.intent as MessageIntent,
          reasoning: result.reasoning || [],
          action: result.action ? { type: result.action.type } : undefined
          // Side effects data removed from storage
        });
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

export {
  markAsEffect,
  createEffectTracker,
} from './middleware';

export type {
  EffectTrackerOptions,
  EffectTracker,
  SideEffectInfo
} from './middleware';