import { s } from 'ajv-ts';
import { describe, expect, it } from 'vitest';
import { createStateValidator } from '../index';

// Define test state interface for type checking
interface TestState {
  counter: number;
  text: string;
  nested: {
    value: boolean;
  };
}

describe('State Schema Validation', () => {
  // Create schema with ajv-ts
  const schema = s.object({
    counter: s.number(),
    text: s.string(),
    nested: s.object({
      value: s.boolean()
    })
  }).required(['counter', 'text', 'nested']);

  const validator = createStateValidator<TestState>(schema);

  it('should validate a correct state', () => {
    const state = {
      counter: 42,
      text: 'test',
      nested: {
        value: true,
      },
    };

    const result = validator.validate(state);
    expect(result.valid).toBe(true);
    expect(result.value).toEqual(state);
    expect(result.errors).toBeUndefined();
  });

  it('should reject an invalid state type', () => {
    const state = {
      counter: 'not a number', // Invalid type
      text: 'test',
      nested: {
        value: true,
      },
    };

    const result = validator.validate(state);
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toBeDefined();
  });

  it('should reject missing required fields', () => {
    const state = {
      counter: 42,
      // Missing 'text' field
      nested: {
        value: true,
      },
    };

    const result = validator.validate(state);
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toBeDefined();
  });

  it('should reject non-object values', () => {
    const result = validator.validate('not an object');
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toEqual(['State must be an object']);
  });
});
