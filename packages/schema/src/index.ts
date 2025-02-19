import type { Action } from '@reduxjs/toolkit';
import type { JSONSchemaType } from 'ajv';

import { hasProperty, isObject, validateSchema } from './validation';

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

  /**
   * Validates if the given value is a valid action according to the schema
   */
  validateAction(value: unknown): value is T {
    // Step 1: Basic structure validation
    if (!isObject(value)) {
      return false;
    }

    // Step 2: Type property validation
    if (!hasProperty(value, 'type') || typeof value.type !== 'string') {
      return false;
    }

    // Step 3: Schema validation
    const { valid } = validateSchema(this.schema, value);
    return valid;
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
export type ActionPayload<T extends Action> = T extends { payload: infer P } ? P : never;
