import type { BaseAction } from '@redux-ai/schema';

// Export additional state-specific types if needed
export interface StateUpdateEvent {
  type: 'state-update';
  payload: unknown;
}

// Re-export BaseAction as the core action type
export type { BaseAction };
