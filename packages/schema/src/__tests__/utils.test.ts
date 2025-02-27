import { Type } from '@sinclair/typebox';
import { describe, expect, it } from 'vitest';

describe('Schema Utils', () => {
  const testSchema = Type.Object({
    counter: Type.Object({
      value: Type.Number(),
    }),
    type: Type.String(),
    payload: Type.Any(),
  });

  it('should create valid TypeBox schema', () => {
    expect(testSchema.type).toBe('object');
    expect(testSchema.properties).toBeDefined();
    expect(testSchema.properties.counter).toBeDefined();
    expect(testSchema.properties.type).toBeDefined();
    expect(testSchema.properties.payload).toBeDefined();
  });
});
