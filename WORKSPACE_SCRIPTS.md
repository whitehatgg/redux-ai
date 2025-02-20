# Workspace Scripts Documentation

## Global Commands
Run these commands from the root directory to affect all packages:

```bash
# Build all packages
pnpm -r build

# Run tests across all packages
pnpm -r test

# Run development mode for all packages
pnpm -r dev

# Run linting across all packages
pnpm -r lint

# Format all code
pnpm -r format
```

## Package-Specific Commands
Run these commands to target specific packages:

```bash
# Build specific package
pnpm --filter @redux-ai/vector build

# Run tests for specific package
pnpm --filter @redux-ai/state test

# Start development mode for specific package
pnpm --filter @redux-ai/react dev

# Lint specific package
pnpm --filter @redux-ai/schema lint
```

## Development Workflow
1. Start the development server:
```bash
pnpm dev
```

2. Run tests in watch mode:
```bash
pnpm -r test:watch
```

## Build Workflow
Build packages in the correct dependency order:
```bash
pnpm -r build
```

## Testing
Run tests with coverage:
```bash
pnpm -r test:coverage
```

## Code Quality
Run all code quality checks:
```bash
pnpm -r lint && pnpm -r format:check
```

## Package Management
Install dependencies across all packages:
```bash
pnpm install
```

Add a dependency to a specific package:
```bash
pnpm --filter @redux-ai/vector add <package-name>
```
