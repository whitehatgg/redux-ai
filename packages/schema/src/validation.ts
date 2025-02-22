import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validates data against a JSON schema
 * @returns Object containing validation result and any error messages
 */
export function validateSchema<T>(schema: JSONSchemaType<T>, data: unknown): ValidationResult {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);

    return {
      valid,
      errors: valid
        ? undefined
        : validate.errors?.map(e => e.message || 'Unknown error').filter(Boolean),
    };
  } catch (error) {
    return {
      valid: false,
      errors: [(error as Error).message],
    };
  }
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<K extends string>(obj: unknown, prop: K): obj is { [P in K]: unknown } {
  return obj !== null && typeof obj === 'object' && prop in obj;
}

/**
 * Type guard to check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
