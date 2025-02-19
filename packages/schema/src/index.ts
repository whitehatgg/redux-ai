import type { Action } from '@reduxjs/toolkit';
import type { JSONSchemaType } from 'ajv';

import { validate } from './validation';

export interface SchemaConfig<T extends Action> {
  schema: JSONSchemaType<T>;
  validatePayload?: boolean;
}

export class ReduxAISchema<T extends Action> {
  private schema: JSONSchemaType<T>;
  private validatePayload: boolean;

  constructor(config: SchemaConfig<T>) {
    this.schema = config.schema;
    this.validatePayload = config.validatePayload ?? true;
  }

  validateAction(action: unknown): action is T {
    if (!action || typeof action !== 'object' || !('type' in action)) {
      return false;
    }

    return validate(this.schema, action);
  }

  /**
   * Get the JSON schema for documentation or external use
   */
  getSchema(): JSONSchemaType<T> {
    return this.schema;
  }
}

export const createReduxAISchema = <T extends Action>(config: SchemaConfig<T>) => {
  return new ReduxAISchema<T>(config);
};

// Helper type to extract payload type from an action
export type ActionPayload<T> =
  T extends Action<any> ? (T extends { payload: infer P } ? P : never) : never;
