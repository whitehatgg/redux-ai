import { validate } from './validation';

export interface SchemaConfig {
  schema: any;
}

export class ReduxAISchema {
  private schema;

  constructor(config: SchemaConfig) {
    this.schema = config.schema;
  }

  validateAction(action: any) {
    return validate(this.schema, action);
  }
}

export const createReduxAISchema = (config: SchemaConfig) => {
  return new ReduxAISchema(config);
};
