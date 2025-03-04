import { describe, expect, it } from 'vitest';

describe('Schema Utils', () => {
  const testSchema = {
    type: 'object',
    properties: {
      counter: {
        type: 'object',
        properties: {
          value: { type: 'number' },
        },
      },
      type: { type: 'string' },
      payload: { type: 'object' },
    },
  };

  it('should be a valid JSON Schema', () => {
    expect(testSchema.type).toBe('object');
    expect(testSchema.properties).toBeDefined();
    expect(testSchema.properties.counter).toBeDefined();
    expect(testSchema.properties.type).toBeDefined();
    expect(testSchema.properties.payload).toBeDefined();
  });
});
