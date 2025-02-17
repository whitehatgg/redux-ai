import { JSONSchemaType } from 'ajv';
import { createReduxAISchema } from '@redux-ai/schema';
import { Action } from '@reduxjs/toolkit';

// Define a generic action shape that AI can work with
interface AIAction extends Action {
  type: string;
  payload?: any;
}

// Create a flexible schema that allows AI to generate valid actions
const aiActionSchema: JSONSchemaType<AIAction> = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    payload: { type: 'object', nullable: true }
  },
  required: ['type'],
  additionalProperties: false
};

// Create ReduxAI schema
export const schema = createReduxAISchema({
  schema: aiActionSchema
});

export type { AIAction };