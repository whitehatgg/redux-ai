import { assign, createMachine } from 'xstate';

// Types
export type StepStatus = 'pending' | 'processing' | 'completed';

export interface PipelineStep {
  message: string;
  status: StepStatus;
}

export interface PipelineContext {
  currentStep: number;
  steps: PipelineStep[];
}

export type MessageIntent = 'action' | 'state' | 'conversation' | 'pipeline';

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  intent?: MessageIntent;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  currentQuery?: string;
  pipeline?: PipelineContext;
}

type QueryEvent = { type: 'QUERY'; query: string };
type ResponseEvent = { type: 'RESPONSE'; message: string; intent?: MessageIntent };
type PipelineStartEvent = { type: 'PIPELINE_START'; steps: Array<{ message: string }> };
type NextStepEvent = { type: 'NEXT_STEP' };

export type DelayedNextStepEvent = { type: 'DELAYED_NEXT_STEP'; delay: number };
export type ConversationEvent =
  | QueryEvent
  | ResponseEvent
  | PipelineStartEvent
  | NextStepEvent
  | DelayedNextStepEvent;

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
      pipeline: undefined,
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
                { role: 'user' as const, content: event.query },
              ],
            }),
          },
          PIPELINE_START: {
            target: 'pipeline',
            actions: assign({
              pipeline: ({ event }) => ({
                currentStep: 0,
                steps: event.steps.map((step, index) => ({
                  message: step.message,
                  status: (index === 0 ? 'processing' : 'pending') as StepStatus,
                })),
              }),
            }),
          },
        },
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
                },
              ],
              currentQuery: () => undefined,
            }),
          },
        },
      },
      pipeline: {
        on: {
          RESPONSE: {
            actions: assign({
              messages: ({ context, event }) => [
                ...context.messages,
                {
                  role: 'assistant' as const,
                  content: event.message,
                  intent: event.intent,
                },
              ],
            }),
          },
          QUERY: {
            actions: assign({
              messages: ({ context, event }) => [
                ...context.messages,
                { role: 'user' as const, content: event.query },
              ],
            }),
          },
          NEXT_STEP: [
            {
              guard: ({ context }) => {
                const pipeline = context.pipeline;
                return pipeline ? pipeline.currentStep >= pipeline.steps.length - 1 : false;
              },
              target: 'idle',
              actions: assign({ pipeline: () => undefined }),
            },
            {
              actions: assign({
                pipeline: ({ context }) => {
                  if (!context.pipeline) return undefined;
                  const nextStep = context.pipeline.currentStep + 1;
                  return {
                    ...context.pipeline,
                    currentStep: nextStep,
                    steps: context.pipeline.steps.map((step, index) => ({
                      ...step,
                      status: (index === context.pipeline?.currentStep
                        ? 'completed'
                        : index === nextStep
                          ? 'processing'
                          : step.status) as StepStatus,
                    })),
                  };
                },
              }),
            },
          ],
          DELAYED_NEXT_STEP: {
            actions: (_context, _event) => {
              // This is a special event that will be delayed by the specified amount
              // The delay is handled by the parent component sending this event
              // after the specified delay
            },
          },
        },
      },
    },
  });
