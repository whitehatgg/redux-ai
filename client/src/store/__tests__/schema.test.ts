import { describe, it, expect } from 'vitest';
import { validateSchema } from '@redux-ai/schema';
import { actionSchemas } from '../schema';

describe('Action Schema Validation', () => {
  it('should validate a valid setSearchTerm action', () => {
    const action = {
      type: 'applicant/setSearchTerm',
      payload: 'test search'
    };
    const result = validateSchema(action, actionSchemas);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid toggleSearch action', () => {
    const action = {
      type: 'applicant/toggleSearch'
    };
    const result = validateSchema(action, actionSchemas);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid setVisibleColumns action', () => {
    const action = {
      type: 'applicant/setVisibleColumns',
      payload: ['name', 'email']
    };
    const result = validateSchema(action, actionSchemas);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid setSortOrder action', () => {
    const action = {
      type: 'applicant/setSortOrder',
      payload: {
        column: 'name',
        direction: 'asc'
      }
    };
    const result = validateSchema(action, actionSchemas);
    expect(result.valid).toBe(true);
  });

  it('should reject an unknown action type', () => {
    const action = {
      type: 'unknown/action',
      payload: {}
    };
    const result = validateSchema(action, actionSchemas);
    expect(result.valid).toBe(false);
  });

  it('should reject an action with invalid payload type', () => {
    const action = {
      type: 'applicant/setSearchTerm',
      payload: 123 // Should be string
    };
    const result = validateSchema(action, actionSchemas);
    expect(result.valid).toBe(false);
  });
});