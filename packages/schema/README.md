# @redux-ai/schema

Core schema definitions and type utilities for the Redux AI state management system, providing comprehensive validation and type safety.

## Features

- Redux action schemas with TypeScript support
- State validation rules with Zod integration
- Type definitions for the entire system
- Validation utilities using Ajv
- Built-in TypeScript type inference
- Comprehensive error reporting
- Custom validation rules support
- Performance optimizations for validation

## Installation

```bash
# Using pnpm (recommended)
pnpm add @redux-ai/schema

# Or using npm
npm install @redux-ai/schema
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

### Action Schemas

#### `createActionSchema(config)`

Creates a new action schema with validation rules.

```typescript
type ActionSchemaConfig = {
  type: string;
  payload: Record<string, any>;
  meta?: Record<string, any>;
};

const schema = createActionSchema({
  type: 'example/action',
  payload: {
    id: { type: 'number' },
    data: { type: 'object' },
  },
});
```

### State Schemas

#### `createStateSchema(config)`

Creates a schema for Redux state validation.

```typescript
type StateSchemaConfig = {
  state: Record<string, any>;
  validators?: Array<(state: any) => boolean>;
};

const stateSchema = createStateSchema({
  state: {
    users: {
      type: 'array',
      items: { type: 'object' },
    },
  },
});
```

### Custom Validation

```typescript
import { addCustomFormat, addCustomKeyword } from '@redux-ai/schema';

// Add custom string format
addCustomFormat('uuid', str => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
});

// Add custom validation keyword
addCustomKeyword('range', {
  type: 'number',
  validate: (schema: any, data: number) => {
    return data >= schema.min && data <= schema.max;
  },
});
```

## Error Handling

The package provides detailed error information:

```typescript
import { ValidationError } from '@redux-ai/schema';

try {
  schema.validate(invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation errors:', error.errors);
    // Access detailed error information
    error.errors.forEach(err => {
      console.log(`Field: ${err.path}, Message: ${err.message}`);
    });
  }
}
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Test Utilities

```typescript
import { createMockSchema } from '@redux-ai/schema/testing';

const mockSchema = createMockSchema({
  type: 'test/action',
  validators: [
    // Custom validation rules
  ],
});
```

## Contributing

Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

MIT
