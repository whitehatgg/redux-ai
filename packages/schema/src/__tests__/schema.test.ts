import type { Action } from '@reduxjs/toolkit';

import { createReduxAISchema } from '../index';

interface TestAction extends Action {
  type: 'test/action';
  payload: {
    value: string;
  };
}

describe('ReduxAISchema', () => {
  const schema = createReduxAISchema<TestAction>({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'test/action' },
        payload: {
          type: 'object',
          properties: {
            value: { type: 'string' },
          },
          required: ['value'],
        },
      },
      required: ['type', 'payload'],
    },
  });

  it('should validate a correct action', () => {
    const action = {
      type: 'test/action',
      payload: { value: 'test' },
    };

    expect(schema.validateAction(action)).toBe(true);
  });

  it('should reject an action with wrong type', () => {
    const action = {
      type: 'wrong/action',
      payload: { value: 'test' },
    };

    expect(schema.validateAction(action)).toBe(false);
  });

  it('should reject an action with wrong payload type', () => {
    const action = {
      type: 'test/action',
      payload: { value: 123 },
    };

    expect(schema.validateAction(action)).toBe(false);
  });

  it('should reject an action with missing payload', () => {
    const action = {
      type: 'test/action',
    };

    expect(schema.validateAction(action)).toBe(false);
  });

  it('should return schema definition', () => {
    const schemaDefinition = schema.getSchema();
    expect(schemaDefinition).toBeDefined();
    expect(schemaDefinition.type).toBe('object');
    expect(schemaDefinition.properties).toBeDefined();
  });
});
