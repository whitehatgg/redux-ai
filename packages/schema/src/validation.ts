import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export function validate<T>(schema: JSONSchemaType<T>, data: unknown): data is T {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Error(`Validation failed: ${validate.errors?.map(e => e.message).join(', ')}`);
  }

  return true;
}
