import { assign, createMachine } from 'xstate';

// Types
export type StepStatus = 'pending' | 'processing' | 'completed' | 'waiting';

export interface WorkflowStep {
  message: string;
  status: StepStatus;
  sideEffectId?: string;
}

export interface WorkflowContext {
  currentStep: number;
  steps: WorkflowStep[];
  pendingSideEffects: string[];
}

export type MessageIntent = 'action' | 'state' | 'conversation' | 'workflow';

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  intent?: MessageIntent;
  sideEffectId?: string;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  currentQuery?: string;
  workflow?: WorkflowContext;
}

type QueryEvent = { type: 'QUERY'; query: string };
type ResponseEvent = { 
  type: 'RESPONSE'; 
  message: string; 
  intent?: MessageIntent;
  sideEffectId?: string;
};
type WorkflowStartEvent = { 
  type: 'WORKFLOW_START'; 
  steps: Array<{ message: string; sideEffectId?: string }> 
};
type NextStepEvent = { type: 'NEXT_STEP' };
type SideEffectCompleteEvent = { type: 'SIDE_EFFECT_COMPLETE'; id: string };

export type ConversationEvent = 
  | QueryEvent 
  | ResponseEvent 
  | WorkflowStartEvent 
  | NextStepEvent
  | SideEffectCompleteEvent;

export const createConversationMachine = () =>
  createMachine({
    id: 'conversation',
    types: {
      context: {} as ConversationContext,
      events: {} as ConversationEvent,
    },
    context: {
      messages: [],
      currentQuery: undefined,
      workflow: undefined
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          QUERY: {
            target: 'processing',
            actions: assign({
              currentQuery: ({ event }) => event.query,
              messages: ({ context, event }) => [
                ...context.messages,
                { role: 'user' as const, content: event.query }
              ]
            })
          },
          WORKFLOW_START: {
            target: 'workflow',
            actions: assign({
              workflow: ({ event }) => ({
                currentStep: 0,
                steps: event.steps.map((step, index) => ({
                  message: step.message,
                  sideEffectId: step.sideEffectId,
                  status: (index === 0 ? 'processing' : 'pending') as StepStatus
                })),
                pendingSideEffects: event.steps
                  .filter(step => step.sideEffectId)
                  .map(step => step.sideEffectId!)
              })
            })
          }
        }
      },
      processing: {
        on: {
          RESPONSE: {
            target: 'idle',
            actions: assign({
              messages: ({ context, event }) => [
                ...context.messages,
                { 
                  role: 'assistant' as const, 
                  content: event.message,
                  intent: event.intent,
                  sideEffectId: event.sideEffectId
                }
              ],
              currentQuery: () => undefined
            })
          }
        }
      },
      workflow: {
        on: {
          RESPONSE: {
            actions: assign({
              messages: ({ context, event }) => [
                ...context.messages,
                { 
                  role: 'assistant' as const, 
                  content: event.message,
                  intent: event.intent,
                  sideEffectId: event.sideEffectId
                }
              ]
            })
          },
          QUERY: {
            actions: assign({
              messages: ({ context, event }) => [
                ...context.messages,
                { role: 'user' as const, content: event.query }
              ]
            })
          },
          SIDE_EFFECT_COMPLETE: {
            actions: assign({
              workflow: ({ context, event }) => {
                if (!context.workflow) return undefined;

                const updatedPendingSideEffects = context.workflow.pendingSideEffects
                  .filter(id => id !== event.id);

                return {
                  ...context.workflow,
                  pendingSideEffects: updatedPendingSideEffects,
                  steps: context.workflow.steps.map(step => 
                    step.sideEffectId === event.id 
                      ? { ...step, status: 'completed' as StepStatus }
                      : step
                  )
                };
              }
            })
          },
          NEXT_STEP: [
            {
              // Guard to check if we can move to next step
              guard: ({ context }) => {
                const workflow = context.workflow;
                if (!workflow) return false;

                // Check if current step has pending side effects
                const currentStep = workflow.steps[workflow.currentStep];
                if (currentStep.sideEffectId && 
                    workflow.pendingSideEffects.includes(currentStep.sideEffectId)) {
                  return false;
                }

                return workflow.currentStep < workflow.steps.length - 1;
              },
              actions: assign({
                workflow: ({ context }) => {
                  if (!context.workflow) return undefined;
                  const nextStep = context.workflow.currentStep + 1;
                  return {
                    ...context.workflow,
                    currentStep: nextStep,
                    steps: context.workflow.steps.map((step, index) => ({
                      ...step,
                      status: (
                        index === context.workflow?.currentStep ? 'completed' :
                        index === nextStep ? 'processing' :
                        step.status
                      ) as StepStatus
                    }))
                  };
                }
              })
            },
            {
              // Guard to check if workflow is complete
              guard: ({ context }) => {
                const workflow = context.workflow;
                return workflow 
                  ? workflow.currentStep >= workflow.steps.length - 1 && 
                    workflow.pendingSideEffects.length === 0
                  : false;
              },
              target: 'idle',
              actions: assign({ workflow: () => undefined })
            }
          ]
        }
      }
    }
  });