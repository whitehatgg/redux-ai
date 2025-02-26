import { s } from 'ajv-ts';

// Core validation types
export type ValidationResult<T> = {
  valid: boolean;
  value: T | null;
  errors?: string[];
};

// Core action type that matches Redux's requirements
export interface BaseAction {
  type: string;
  payload?: unknown;
}

// Schema validator function
export function validateSchema<T>(data: unknown, schema: ReturnType<typeof s.object>): ValidationResult<T> {
  if (!schema) {
    return { valid: false, value: null, errors: ['Invalid schema'] };
  }

  try {
    const result = schema.parse(data) as T;
    return { valid: true, value: result };
  } catch (error) {
    const errors = error instanceof Error ? [error.message] : ['Unknown validation error'];
    return { valid: false, value: null, errors };
  }
}

// Re-export schema utilities
export { s };