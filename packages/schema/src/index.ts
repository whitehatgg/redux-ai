import type { Action } from '@reduxjs/toolkit';
import type { JSONSchemaType } from 'ajv';

import { hasProperty, isObject, validateSchema, type ValidationResult } from './validation';

export interface SchemaConfig<T extends Action> {
  schema: JSONSchemaType<T>;
  validatePayload?: boolean;
}

export interface ValidationResultWithValue<T> extends ValidationResult {
  value: T | null;
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
  validateAction(value: unknown): ValidationResultWithValue<T> {
    // Step 1: Basic structure validation
    if (!isObject(value)) {
      return {
        valid: false,
        errors: ['Value must be an object'],
        value: null,
      };
    }

    // Step 2: Type property validation
    if (!hasProperty(value, 'type') || typeof value.type !== 'string') {
      return {
        valid: false,
        errors: ['Action must have a string "type" property'],
        value: null,
      };
    }

    // Step 3: Schema validation
    const result = validateSchema(this.schema, value);

    return {
      ...result,
      value: result.valid ? (value as T) : null,
    };
  }

  /**
   * Get the JSON schema for documentation or external use
   */
  getSchema(): JSONSchemaType<T> {
    return this.schema;
  }
}

export function createReduxAISchema<T extends Action>(config: SchemaConfig<T>): ReduxAISchema<T> {
  return new ReduxAISchema<T>(config);
}

// Helper type to extract payload type from an action
export type ActionPayload<T extends Action> = T extends { payload: infer P } ? P : never;
