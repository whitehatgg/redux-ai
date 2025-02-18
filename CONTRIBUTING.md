# Contributing to Redux AI

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Start development:
```bash
pnpm run dev
```

## Making Changes

1. Create a new branch for your changes
2. Make your changes
3. Run tests and linting:
```bash
pnpm run lint
pnpm run test
```

4. Create a changeset to document your changes:
```bash
pnpm changeset
```

5. Commit your changes and create a pull request

## Publishing

Packages are automatically published to npm when changes are merged to main. The process:

1. Changes are merged to main
2. CI runs tests and builds packages
3. If successful, changesets creates a release PR or publishes to npm
4. New versions are automatically published with proper semver increments

## Package Structure

- `@redux-ai/schema`: Type definitions and schema validation
- `@redux-ai/state`: Core state management functionality
- `@redux-ai/vector`: Vector storage implementation
- `@redux-ai/react`: React components and hooks
