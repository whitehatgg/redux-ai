import { s } from 'ajv-ts';
import { describe, expect, it } from 'vitest';
import { validateSchema } from '../index';

describe('Schema Validation', () => {
  const schema = s.object({
    counter: s.number(),
    text: s.string(),
    nested: s.object({
      value: s.boolean()
    })
  }).required(['counter', 'text', 'nested']);

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
    expect(result.errors).toContain('must have required property \'text\'');
  });

  it('should reject non-object values', () => {
    const result = validateSchema('not an object', schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('must be object');
  });
});