import Ajv from 'ajv';

// Schema validator function
export function validateSchema(data, schema) {
  const ajv = new Ajv({
    strict: true,
    allErrors: true,
    removeAdditional: true, // Remove additional properties not in schema
    useDefaults: true,
    coerceTypes: false,
  });
  try {
    const validate = ajv.compile(schema);
    const isValid = validate(data);
    if (!isValid) {
      const errors = (validate.errors || []).map(error => ({
        path: error.instancePath || '',
        message: error.message || 'Unknown validation error',
      }));
      return { valid: false, value: null, errors };
    }
    return { valid: true, value: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    return { valid: false, value: null, errors: [{ path: '', message }] };
  }
}
//# sourceMappingURL=index.js.map
