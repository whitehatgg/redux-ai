import { Type } from '@sinclair/typebox';
import { describe, expect, it } from 'vitest';

import { validateSchema } from '../index';

describe('Schema Validation', () => {
  const schema = Type.Object(
    {
      counter: Type.Number(),
      text: Type.String(),
      nested: Type.Object({
        value: Type.Boolean(),
      }),
    },
    { required: ['counter', 'text', 'nested'] }
  );

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
    expect(error?.message).toContain('Expected number');
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

    // Verify text property is reported as missing
    const textError = result.errors?.find(e => e.path === '/text');
    expect(textError).toBeDefined();
    expect(textError?.message).toContain('Expected required property');
  });

  it('should reject non-object values', () => {
    const result = validateSchema('not an object', schema);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].message).toContain('Expected object');
  });
});
