import Ajv from 'ajv';

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

// Schema validator function with simplified AJV settings
export function validateSchema<T>(data: unknown, schema: Record<string, any>): ValidationResult<T> {
  const ajv = new Ajv({
    strict: false,
    allErrors: false, // Only return first error for clearer validation
    useDefaults: true,
    discriminator: true,
    strictTypes: true, // Enable strict type checking for discriminated unions
  });

  try {
    const validate = ajv.compile(schema);
    const isValid = validate(data);

    if (!isValid) {
      const error = validate.errors?.[0];
      return {
        valid: false,
        value: null,
        errors: error
          ? [
              {
                path: error.instancePath || '',
                message: error.message || 'Unknown validation error',
              },
            ]
          : undefined,
      };
    }

    return { valid: true, value: data as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    return { valid: false, value: null, errors: [{ path: '', message }] };
  }
}
