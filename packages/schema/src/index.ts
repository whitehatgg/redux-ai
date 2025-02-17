import { validate } from './validation';
import { JSONSchemaType } from 'ajv';

export interface SchemaConfig<T> {
  schema: JSONSchemaType<T>;
}

export class ReduxAISchema<T> {
  private schema: JSONSchemaType<T>;

  constructor(config: SchemaConfig<T>) {
    this.schema = config.schema;
  }

  validateAction(action: unknown): action is T {
    return validate(this.schema, action);
  }
}

export const createReduxAISchema = <T>(config: SchemaConfig<T>) => {
  return new ReduxAISchema<T>(config);
};