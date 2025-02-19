import Ajv from 'ajv';

const ajv = new Ajv();

export function validate(schema: any, data: any) {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Error(`Validation failed: ${validate.errors?.map(e => e.message).join(', ')}`);
  }

  return true;
}
