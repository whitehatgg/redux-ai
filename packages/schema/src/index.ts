import { Type } from '@sinclair/typebox';
import type { Static, TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

// Core validation types
export type ValidationResult<T> = {
  valid: boolean;
  value: T | null;
  errors?: { path: string; message: string }[];
};

// Core action type that matches Redux's requirements
export interface BaseAction {
  type: string;
  payload?: unknown;
}

// Schema validator function
export function validateSchema<T extends TSchema>(
  data: unknown,
  schema: T
): ValidationResult<Static<T>> {
  if (!schema) {
    return { valid: false, value: null, errors: [{ path: '', message: 'Invalid schema' }] };
  }

  try {
    const C = TypeCompiler.Compile(schema);
    const isValid = C.Check(data);

    if (!isValid) {
      const errors = [...C.Errors(data)].map(error => {
        return {
          path: error.path,
          message: error.message,
        };
      });
      return { valid: false, value: null, errors };
    }

    return { valid: true, value: data as Static<T> };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    return { valid: false, value: null, errors: [{ path: '', message }] };
  }
}

// Re-export TypeBox utilities
export { Type, type TSchema, type Static };
