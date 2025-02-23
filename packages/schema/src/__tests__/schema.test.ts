import type { Action } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import { createReduxAISchema } from '../index';

/**
 * Test suite for ReduxAISchema
 *
 * Note: This test file focuses on synchronous validation functions
 * and doesn't require complex mocking patterns. However, we still
 * follow best practices for test isolation and setup.
 */

interface TestAction extends Action {
  type: 'test/action';
  payload: {
    value: string;
  };
}

describe('ReduxAISchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    const result = schema.validateAction(action);
    expect(result.valid).toBe(true);
    expect(result.value).toEqual(action);
    expect(result.errors).toBeUndefined();
  });

  it('should reject an action with wrong type', () => {
    const action = {
      type: 'wrong/action',
      payload: { value: 'test' },
    };

    const result = schema.validateAction(action);
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should reject an action with wrong payload type', () => {
    const action = {
      type: 'test/action',
      payload: { value: 123 },
    };

    const result = schema.validateAction(action);
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should reject an action with missing payload', () => {
    const action = {
      type: 'test/action',
    };

    const result = schema.validateAction(action);
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should reject non-object values', () => {
    const result = schema.validateAction('not an object');
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toEqual(['Value must be an object']);
  });

  it('should return schema definition', () => {
    const schemaDefinition = schema.getSchema();
    expect(schemaDefinition).toBeDefined();
    expect(schemaDefinition.type).toBe('object');
    expect(schemaDefinition.properties).toBeDefined();
  });
});
