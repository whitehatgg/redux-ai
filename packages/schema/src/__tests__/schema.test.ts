import { describe, expect, it } from 'vitest';

import { validateSchema } from '../index';

describe('Schema Validation', () => {
  const schema = {
    type: 'object',
    required: ['counter', 'text', 'nested'],
    properties: {
      counter: { type: 'number' },
      text: { type: 'string' },
      nested: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'boolean' },
        },
      },
    },
  };

  it('should validate a correct state', () => {
    const state = {
      counter: 42,
      text: 'test',
      nested: {
        value: true,
      },
    };

    const result = validateSchema(state, schema);
    expect(result.valid).toBe(true);
    expect(result.value).toEqual(state);
  });

  it('should reject an invalid state type', () => {
    const state = {
      counter: 'not a number',
      text: 'test',
      nested: {
        value: true,
      },
    };

    const result = validateSchema(state, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);

    // Find the error for the counter field
    const error = result.errors?.find(e => e.path === '/counter');
    expect(error).toBeDefined();
    expect(error?.message).toContain('must be number');
  });

  it('should reject missing required fields', () => {
    const state = {
      counter: 42,
      nested: {
        value: true,
      },
    };

    const result = validateSchema(state, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);

    // Verify required property error
    const missingErrors = result.errors?.filter(e => e.message.includes('required'));
    expect(missingErrors?.length).toBeGreaterThan(0);
  });

  it('should reject non-object values', () => {
    const result = validateSchema('not an object', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].message).toContain('must be object');
  });
});
