# @redux-ai/schema

Core schema definitions and type utilities for the Redux AI state management system.

## Features

- Redux action schemas with TypeScript support
- State validation rules with Zod integration
- Type definitions for the entire system
- Validation utilities using Ajv
- Built-in TypeScript type inference

## Installation

```bash
pnpm add @redux-ai/schema
```

## Usage

```typescript
import { createActionSchema, type ActionSchema } from '@redux-ai/schema';

// Define an action schema
const addUserSchema = createActionSchema({
  type: 'users/add',
  payload: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['user', 'admin'] },
  },
});

// Type inference for your actions
type AddUserAction = ActionSchema<typeof addUserSchema>;

// Validate action payload
const isValid = addUserSchema.validate({
  type: 'users/add',
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  },
});
```

## API Reference

### `createActionSchema(config)`

Creates a new action schema with validation rules.

#### Parameters

- `config` (object)
  - `type` (string) - Action type identifier
  - `payload` (object) - JSON Schema for the action payload
  - `meta` (object, optional) - JSON Schema for action metadata

#### Returns

Returns a schema object with:

- `validate(action)` - Validates an action against the schema
- `type` - The action type string
- `schema` - The complete JSON schema object

### `createStateSchema(config)`

Creates a schema for Redux state validation.

#### Parameters

- `config` (object)
  - `state` (object) - JSON Schema for the state structure
  - `validators` (array, optional) - Custom validation functions

#### Returns

Returns a state validator with:

- `validate(state)` - Validates state against schema
- `addValidator(fn)` - Adds a custom validation function
