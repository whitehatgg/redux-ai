import { JSONSchemaType } from 'ajv';
import { createReduxAISchema } from '@redux-ai/schema';
import { Action } from '@reduxjs/toolkit';

// Define the action shape that AI can work with
interface AIAction extends Action {
  type: 'INCREMENT' | 'DECREMENT' | 'SET_MESSAGE' | 'RESET_COUNTER';
  payload?: string | number;
}

// Create a schema that matches our demo slice actions
const aiActionSchema: JSONSchemaType<AIAction> = {
  type: 'object',
  properties: {
    type: { 
      type: 'string',
      enum: ['INCREMENT', 'DECREMENT', 'SET_MESSAGE', 'RESET_COUNTER']
    },
    payload: { 
      type: ['string', 'number', 'null'],
      nullable: true 
    }
  },
  required: ['type'],
  additionalProperties: false
};

// Create ReduxAI schema that validates against our demo actions
export const schema = createReduxAISchema({
  schema: aiActionSchema
});

export type { AIAction };