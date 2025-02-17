import { createMachine } from 'xstate';

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  currentQuery?: string;
}

export const createConversationMachine = () => {
  return createMachine({
    id: 'conversation',
    initial: 'idle',
    context: {
      messages: [],
      currentQuery: undefined,
    },
    states: {
      idle: {
        on: {
          QUERY: {
            target: 'processing',
            actions: ['setCurrentQuery'],
          },
        },
      },
      processing: {
        on: {
          RESPONSE: {
            target: 'idle',
            actions: ['addMessage'],
          },
          ERROR: {
            target: 'idle',
            actions: ['handleError'],
          },
        },
      },
    },
  });
};
