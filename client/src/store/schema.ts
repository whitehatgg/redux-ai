import { JSONSchemaType } from 'ajv';
import { createReduxAISchema } from '@redux-ai/schema';
import { Action } from '@reduxjs/toolkit';

// Define the shape of our actions
interface CounterAction extends Action {
  type: 'INCREMENT' | 'DECREMENT';
}

interface MessageAction extends Action {
  type: 'SET_MESSAGE';
  payload: string;
}

// Create JSON schemas for our actions
const counterActionSchema: JSONSchemaType<CounterAction> = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['INCREMENT', 'DECREMENT'] }
  },
  required: ['type'],
  additionalProperties: false
};

const messageActionSchema: JSONSchemaType<MessageAction> = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'SET_MESSAGE' },
    payload: { type: 'string' }
  },
  required: ['type', 'payload'],
  additionalProperties: false
};

// Create ReduxAI schemas
export const counterSchema = createReduxAISchema({
  schema: counterActionSchema
});

export const messageSchema = createReduxAISchema({
  schema: messageActionSchema
});

// Export types for use in other files
export type { CounterAction, MessageAction };
