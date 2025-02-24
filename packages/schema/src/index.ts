import type { s } from 'ajv-ts';

export type ValidationResult<T> = {
  valid: boolean;
  value: T | null;
  errors?: string[];
};

export interface StateValidator<T> {
  schema: ReturnType<typeof s.object>;
  validate: (value: unknown) => ValidationResult<T>;
}

export function validateState<T>(value: unknown, schema: ReturnType<typeof s.object>): ValidationResult<T> {
  // Basic type check first 
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      valid: false,
      value: null,
      errors: ['State must be an object'],
    };
  }

  try {
    // Use validate directly - it will check against the schema
    const validationResult = schema.validate(value);
    if (!validationResult) {
      const errorMessages = (schema as any).error?.map((err: { message: string }) => err.message);
      return {
        valid: false,
        value: null,
        errors: errorMessages || ['Invalid state format'],
      };
    }

    return {
      valid: true,
      value: value as T,
    };
  } catch (error) {
    return {
      valid: false,
      value: null,
      errors: [(error as Error).message],
    };
  }
}

export function createStateValidator<T>(schema: ReturnType<typeof s.object>): StateValidator<T> {
  return {
    schema,
    validate: (value: unknown): ValidationResult<T> => validateState(value, schema),
  };
}