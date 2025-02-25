import type { AnyAction } from '@reduxjs/toolkit';
import { s } from 'ajv-ts';
import { safeStringify } from './utils';

// Core validation types
export type ValidationResult<T> = {
  valid: boolean;
  value: T | null;
  errors?: string[];
};

// Base action type
export interface BaseAction extends AnyAction {
  type: string;
  payload?: unknown;
}

// Schema validator function
export function validateSchema(data: unknown, schema: ReturnType<typeof s.object>): boolean {
  if (!schema) {
    console.error('Invalid schema: schema is null or undefined');
    return false;
  }

  // Debug logs using safeStringify to handle circular references
  console.log('Validating data:', safeStringify(data));
  console.log('Against schema:', safeStringify(schema));

  try {
    const result = schema.parse(data);
    console.log('Validation result:', safeStringify(result));
    return true;
  } catch (error) {
    console.error('Schema validation failed:', error);
    if (error instanceof Error) {
      console.error('Validation error details:', error.message);
    }
    return false;
  }
}

// Re-export schema utilities
export { s };